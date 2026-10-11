import { Body,Controller,Get,Param,Patch,Post,Query } from '@nestjs/common';
import { IsNotEmpty,IsObject,IsString } from 'class-validator';
import { CaptureService } from './capture.service';
class CaptureDto{@IsString()@IsNotEmpty()userId!:string;@IsString()@IsNotEmpty()rawText!:string}
class UserDto{@IsString()@IsNotEmpty()userId!:string}
class EditDto extends UserDto{@IsObject()payload!:Record<string,unknown>}
class SupersedeDto extends UserDto{@IsString()@IsNotEmpty()replacementId!:string}
@Controller('capture')
export class CaptureController{
 constructor(private capture:CaptureService){}
 @Post()create(@Body()d:CaptureDto){return this.capture.capture(d.userId,d.rawText)}
 @Get('pending')pending(@Query('userId')u:string){return this.capture.list(u)}
 @Patch(':id')edit(@Param('id')id:string,@Body()d:EditDto){return this.capture.edit(d.userId,id,d.payload)}
 @Post(':id/approve')approve(@Param('id')id:string,@Body()d:UserDto){return this.capture.approve(d.userId,id)}
 @Post(':id/reject')reject(@Param('id')id:string,@Body()d:UserDto){return this.capture.reject(d.userId,id)}
 @Post('memory/:id/supersede')supersede(@Param('id')id:string,@Body()d:SupersedeDto){return this.capture.supersede(d.userId,id,d.replacementId)}
}
