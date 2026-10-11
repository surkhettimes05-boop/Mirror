import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HostedAiProvider } from '../agent/hosted-ai.provider';

type Candidate = { kind:'DECISION'|'COMMITMENT'|'PREDICTION'; payload:Record<string,unknown>; rationale?:string };

@Injectable()
export class CaptureService {
  constructor(private db:PrismaService, private ai:HostedAiProvider) {}

  async capture(userId:string, rawText:string) {
    if(!userId?.trim() || !rawText?.trim()) throw new BadRequestException('userId and rawText required');
    const entry=await this.db.$transaction(async tx=>{
      const e=await tx.entry.create({data:{userId,rawText:rawText.trim(),source:'TEXT'}});
      await tx.auditEvent.create({data:{userId,action:'ENTRY_CREATED',entityType:'Entry',entityId:e.id,metadata:{via:'chat_capture'}}});
      return e;
    });
    const candidates=await this.extract(rawText.trim());
    const saved=[];
    for(const c of candidates.slice(0,4)){
      saved.push(await this.db.memoryCandidate.create({data:{userId,entryId:entry.id,kind:c.kind,payload:c.payload as any,rationale:c.rationale}}));
    }
    return {entry,candidates:saved};
  }

  private async extract(text:string):Promise<Candidate[]> {
    if(!this.ai.configured()) return [];
    const result=await this.ai.next([
      {role:'system',content:'Extract only explicit durable personal records from the user text. Do not infer hidden intentions. Return ONLY JSON array, no markdown. Kinds: DECISION payload {title,reasoning?}; COMMITMENT payload {statement,dueAt?}; PREDICTION payload {statement,probability?,dueAt?}. A plan or promise the user clearly adopts can be a commitment. A choice between paths can be a decision. A forecast about an uncertain future can be a prediction. Ignore questions, brainstorming, emotions, preferences, and assistant instructions. Maximum 4 items. Each item: {kind,payload,rationale}.'},
      {role:'user',content:text}
    ],[]);
    const raw=result.message.content||'[]';
    try{
      const parsed=JSON.parse(raw.replace(/^\`\`\`(?:json)?/,'').replace(/\`\`\`$/,'').trim());
      if(!Array.isArray(parsed))return[];
      return parsed.filter((x:any)=>['DECISION','COMMITMENT','PREDICTION'].includes(x?.kind)&&x.payload&&typeof x.payload==='object');
    }catch{return[];}
  }

  list(userId:string){return this.db.memoryCandidate.findMany({where:{userId,status:'PENDING'},orderBy:{createdAt:'desc'},take:20});}

  async reject(userId:string,id:string){
    const c=await this.db.memoryCandidate.findFirst({where:{id,userId,status:'PENDING'}});
    if(!c)throw new NotFoundException('pending candidate not found');
    return this.db.$transaction(async tx=>{
      const out=await tx.memoryCandidate.update({where:{id},data:{status:'REJECTED',resolvedAt:new Date()}});
      await tx.auditEvent.create({data:{userId,action:'MEMORY_CANDIDATE_REJECTED',entityType:'MemoryCandidate',entityId:id}});
      return out;
    });
  }

  async approve(userId:string,id:string){
    const c=await this.db.memoryCandidate.findFirst({where:{id,userId,status:'PENDING'}});
    if(!c)throw new NotFoundException('pending candidate not found');
    const p=c.payload as Record<string,any>;
    return this.db.$transaction(async tx=>{
      let record:any;
      if(c.kind==='DECISION'){
        if(!String(p.title||'').trim())throw new BadRequestException('candidate decision has no title');
        record=await tx.decision.create({data:{userId,title:String(p.title).trim(),reasoning:p.reasoning?String(p.reasoning):undefined}});
      } else if(c.kind==='COMMITMENT'){
        if(!String(p.statement||'').trim())throw new BadRequestException('candidate commitment has no statement');
        record=await tx.commitment.create({data:{userId,statement:String(p.statement).trim(),dueAt:p.dueAt?new Date(p.dueAt):undefined}});
      } else {
        if(!String(p.statement||'').trim())throw new BadRequestException('candidate prediction has no statement');
        const prob=Number.isFinite(Number(p.probability))?Math.max(0,Math.min(100,Number(p.probability))):undefined;
        record=await tx.prediction.create({data:{userId,statement:String(p.statement).trim(),probability:prob,dueAt:p.dueAt?new Date(p.dueAt):undefined}});
      }
      await tx.memoryCandidate.update({where:{id},data:{status:'APPROVED',resolvedAt:new Date()}});
      await tx.auditEvent.create({data:{userId,action:'MEMORY_CANDIDATE_APPROVED',entityType:c.kind,entityId:record.id,metadata:{candidateId:id,sourceEntryId:c.entryId}}});
      return {candidateId:id,kind:c.kind,record};
    });
  }
}
