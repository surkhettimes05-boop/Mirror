import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HostedAiProvider } from '../agent/hosted-ai.provider';

type Candidate={kind:'DECISION'|'COMMITMENT'|'PREDICTION';payload:Record<string,any>;rationale?:string};
@Injectable()
export class CaptureService{
 constructor(private db:PrismaService,private ai:HostedAiProvider){}
 async capture(userId:string,rawText:string){
  if(!userId?.trim()||!rawText?.trim())throw new BadRequestException('userId and rawText required');
  const entry=await this.db.$transaction(async tx=>{const e=await tx.entry.create({data:{userId,rawText:rawText.trim(),source:'TEXT'}});await tx.auditEvent.create({data:{userId,action:'ENTRY_CREATED',entityType:'Entry',entityId:e.id,metadata:{via:'chat_capture'}}});return e;});
  const candidates=await this.extract(rawText.trim());
  const saved=[];for(const c of candidates.slice(0,4)){const payload=this.normalize(c.payload);const duplicate=await this.findOverlap(userId,c.kind,this.text(c.kind,payload));saved.push({...await this.db.memoryCandidate.create({data:{userId,entryId:entry.id,kind:c.kind,payload,rationale:c.rationale}}),duplicateWarning:duplicate});}
  return{entry,candidates:saved};
 }
 private normalize(p:Record<string,any>){const out={...p};for(const k of ['dueAt','reviewAt'])if(out[k]){const d=new Date(out[k]);out[k]=isNaN(d.getTime())?undefined:d.toISOString();}if(out.probability!==undefined){const n=Number(out.probability);out.probability=Number.isFinite(n)?Math.max(0,Math.min(100,n)):undefined;}return out;}
 private text(kind:string,p:any){return String(kind==='DECISION'?p.title:p.statement||'').trim();}
 private tokens(x:string){return new Set(x.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!['the','and','for','that','will','with','this','another'].includes(w)));}
 private score(a:string,b:string){const A=this.tokens(a),B=this.tokens(b);if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/Math.min(A.size,B.size);}
 private async findOverlap(userId:string,kind:string,text:string){
  const records=await this.db.memoryRecord.findMany({where:{userId,status:'ACTIVE'},orderBy:{createdAt:'desc'},take:100});
  const same=records.filter(r=>r.kind===kind).map(r=>({id:r.id,entityId:r.entityId,text:r.canonicalText,score:this.score(text,r.canonicalText)})).sort((a,b)=>b.score-a.score)[0];
  return same&&same.score>=0.6?same:null;
 }
 private async extract(text:string):Promise<Candidate[]>{
  if(!this.ai.configured())return[];
  const now=new Date().toISOString();
  const r=await this.ai.next([{role:'system',content:'Extract only explicit durable personal records. Return ONLY JSON array. Kinds: DECISION {title,reasoning?,reviewAt?}; COMMITMENT {statement,dueAt?}; PREDICTION {statement,probability?,dueAt?}. Resolve relative dates using current time '+now+'. Do not infer hidden intentions. Ignore questions, brainstorming, emotions and preferences. Max 4. Each item {kind,payload,rationale}.'},{role:'user',content:text}],[]);
  try{const p=JSON.parse((r.message.content||'[]').replace(/^```(?:json)?/,'').replace(/```$/,'').trim());return Array.isArray(p)?p.filter((x:any)=>['DECISION','COMMITMENT','PREDICTION'].includes(x?.kind)&&x.payload&&typeof x.payload==='object'):[];}catch{return[];}
 }
 list(userId:string){return this.db.memoryCandidate.findMany({where:{userId,status:'PENDING'},orderBy:{createdAt:'desc'},take:20});}
 async edit(userId:string,id:string,payload:Record<string,any>){const c=await this.db.memoryCandidate.findFirst({where:{id,userId,status:'PENDING'}});if(!c)throw new NotFoundException('pending candidate not found');const normalized=this.normalize(payload);await this.db.auditEvent.create({data:{userId,action:'MEMORY_CANDIDATE_EDITED',entityType:'MemoryCandidate',entityId:id,metadata:{before:c.payload,after:normalized}}});return this.db.memoryCandidate.update({where:{id},data:{payload:normalized}});}
 async reject(userId:string,id:string){const c=await this.db.memoryCandidate.findFirst({where:{id,userId,status:'PENDING'}});if(!c)throw new NotFoundException('pending candidate not found');return this.db.$transaction(async tx=>{const out=await tx.memoryCandidate.update({where:{id},data:{status:'REJECTED',resolvedAt:new Date()}});await tx.auditEvent.create({data:{userId,action:'MEMORY_CANDIDATE_REJECTED',entityType:'MemoryCandidate',entityId:id}});return out;});}
 async approve(userId:string,id:string){
  const c=await this.db.memoryCandidate.findFirst({where:{id,userId,status:'PENDING'}});if(!c)throw new NotFoundException('pending candidate not found');const p=c.payload as any;const canonical=this.text(c.kind,p);if(!canonical)throw new BadRequestException('candidate has no durable text');
  return this.db.$transaction(async tx=>{let record:any;if(c.kind==='DECISION')record=await tx.decision.create({data:{userId,title:canonical,reasoning:p.reasoning,reviewAt:p.reviewAt?new Date(p.reviewAt):undefined}});else if(c.kind==='COMMITMENT')record=await tx.commitment.create({data:{userId,statement:canonical,dueAt:p.dueAt?new Date(p.dueAt):undefined}});else record=await tx.prediction.create({data:{userId,statement:canonical,probability:p.probability,dueAt:p.dueAt?new Date(p.dueAt):undefined}});
   const provenance=await tx.memoryRecord.create({data:{userId,sourceEntryId:c.entryId,kind:c.kind,entityId:record.id,canonicalText:canonical}});
   await tx.memoryCandidate.update({where:{id},data:{status:'APPROVED',resolvedAt:new Date()}});
   await tx.auditEvent.create({data:{userId,action:'MEMORY_CANDIDATE_APPROVED',entityType:c.kind,entityId:record.id,metadata:{candidateId:id,sourceEntryId:c.entryId,provenanceId:provenance.id}}});
   return{candidateId:id,kind:c.kind,record,provenance};
  });
 }
 async supersede(userId:string,id:string,replacementId:string){if(id===replacementId)throw new BadRequestException('replacement must differ');const [old,next]=await Promise.all([this.db.memoryRecord.findFirst({where:{id,userId,status:'ACTIVE'}}),this.db.memoryRecord.findFirst({where:{id:replacementId,userId,status:'ACTIVE'}})]);if(!old||!next)throw new NotFoundException('active memory record not found');if(old.kind!==next.kind)throw new BadRequestException('memory kinds must match');return this.db.$transaction(async tx=>{const out=await tx.memoryRecord.update({where:{id},data:{status:'SUPERSEDED',supersededById:replacementId}});await tx.auditEvent.create({data:{userId,action:'MEMORY_SUPERSEDED',entityType:'MemoryRecord',entityId:id,metadata:{replacementId}}});return out;});}
}
