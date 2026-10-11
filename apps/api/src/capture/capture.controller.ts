import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { CaptureService } from './capture.service';
class CaptureDto { @IsString() @IsNotEmpty() userId!:string; @IsString() @IsNotEmpty() rawText!:string; }
class UserDto { @IsString() @IsNotEmpty() userId!:string; }
@Controller('capture')
export class CaptureController {
 constructor(private capture:CaptureService){}
 @Post() create(@Body() dto:CaptureDto){return this.capture.capture(dto.userId,dto.rawText);}
 @Get('pending') pending(@Query('userId') userId:string){return this.capture.list(userId);}
 @Post(':id/approve') approve(@Param('id') id:string,@Body() dto:UserDto){return this.capture.approve(dto.userId,id);}
 @Post(':id/reject') reject(@Param('id') id:string,@Body() dto:UserDto){return this.capture.reject(dto.userId,id);}
}
