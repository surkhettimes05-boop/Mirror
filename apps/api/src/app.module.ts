import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { UiController } from './ui.controller';
import { PrismaService } from './prisma.service';
import { EntriesModule } from './entries/entries.module';
import { AgentModule } from './agent/agent.module';
import { MemoryModule } from './memory/memory.module';
import { EvidenceModule } from './evidence/evidence.module';
import { DecisionsModule } from './decisions/decisions.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { WhyModule } from './why/why.module';
import { CaptureModule } from './capture/capture.module';
import { DebriefsModule } from './debriefs/debriefs.module';

@Module({
  imports: [EntriesModule, MemoryModule, EvidenceModule, DecisionsModule, CommitmentsModule, WhyModule, CaptureModule, DebriefsModule, AgentModule],
  controllers: [UiController, HealthController],
  providers: [PrismaService],
})
export class AppModule {}
