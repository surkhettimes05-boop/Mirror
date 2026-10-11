import { BadRequestException,Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class DebriefsService{
 constructor(private db:PrismaService){}
 async open(userId:string){const [commitments,predictions,decisions]=await Promise.all([
  this.db.commitment.findMany({where:{userId,status:'OPEN',NOT:{statement:{startsWith:'[SEED]'}}},orderBy:[{dueAt:'asc'},{createdAt:'desc'}],take:30}),
  this.db.prediction.findMany({where:{userId,status:'OPEN',NOT:{statement:{startsWith:'[SEED]'}}},orderBy:[{dueAt:'asc'},{createdAt:'desc'}],take:30}),
  this.db.decision.findMany({where:{userId,NOT:{title:{startsWith:'[SEED]'}}},orderBy:{createdAt:'desc'},take:20})
 ]);return{commitments,predictions,decisions};}
 async create(b:any){
  if(!b.userId||!b.targetKind||!b.targetId||!b.actualOutcome?.trim()||!b.result)throw new BadRequestException('userId, target, result and actualOutcome required');
  if(!['COMMITMENT','PREDICTION','DECISION'].includes(b.targetKind)||!['SUCCEEDED','PARTIAL','FAILED','INVALIDATED','UNKNOWN'].includes(b.result))throw new BadRequestException('invalid debrief classification');
  const target=await this.target(b.userId,b.targetKind,b.targetId);if(!target)throw new NotFoundException('target not found');
  return this.db.$transaction(async tx=>{
   const entry=await tx.entry.create({data:{userId:b.userId,source:'TEXT',rawText:b.actualOutcome.trim()}});
   const d=await tx.debrief.create({data:{userId:b.userId,sourceEntryId:entry.id,targetKind:b.targetKind,targetId:b.targetId,result:b.result,actualOutcome:b.actualOutcome.trim(),lesson:b.lesson?.trim()||undefined,evidence:b.evidence?.trim()||undefined}});
   if(b.targetKind==='COMMITMENT'&&['SUCCEEDED','PARTIAL','FAILED','INVALIDATED'].includes(b.result)){await tx.commitment.update({where:{id:b.targetId},data:{status:b.result==='SUCCEEDED'?'COMPLETED':'ABANDONED',completedAt:b.result==='SUCCEEDED'?new Date():null}});}
   if(b.targetKind==='PREDICTION'){await tx.prediction.update({where:{id:b.targetId},data:{status:'RESOLVED',actualOutcome:b.actualOutcome.trim(),resolvedAt:new Date()}});}
   await tx.auditEvent.create({data:{userId:b.userId,action:'DEBRIEF_RECORDED',entityType:b.targetKind,entityId:b.targetId,metadata:{debriefId:d.id,result:b.result,sourceEntryId:entry.id}}});
   return d;
  });
 }
 private target(userId:string,k:string,id:string){if(k==='COMMITMENT')return this.db.commitment.findFirst({where:{id,userId}});if(k==='PREDICTION')return this.db.prediction.findFirst({where:{id,userId}});return this.db.decision.findFirst({where:{id,userId}});}
 history(userId:string){return this.db.debrief.findMany({where:{userId},orderBy:{createdAt:'desc'},take:50});}
}
