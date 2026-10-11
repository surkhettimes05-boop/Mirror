import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HostedAiProvider } from '../agent/hosted-ai.provider';
import { CaptureController } from './capture.controller';
import { CaptureService } from './capture.service';
@Module({controllers:[CaptureController],providers:[PrismaService,HostedAiProvider,CaptureService],exports:[CaptureService]})
export class CaptureModule {}
