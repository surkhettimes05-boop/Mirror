import { Controller, Get, Header } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Controller()
export class UiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  home() {
    return readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
  }
}
