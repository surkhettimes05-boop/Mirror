import { Body,Controller,Get,Post,Query } from '@nestjs/common';import { DebriefsService } from './debriefs.service';
@Controller('debriefs')export class DebriefsController{constructor(private s:DebriefsService){}@Get('open')open(@Query('userId')u:string){return this.s.open(u)}@Get()history(@Query('userId')u:string){return this.s.history(u)}@Post()create(@Body()b:any){return this.s.create(b)}}
