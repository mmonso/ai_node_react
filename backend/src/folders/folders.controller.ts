import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  // ValidationPipe, // Não é mais necessário importar localmente se global está ativo
  HttpCode, // Adicionar HttpCode para o status 204 no delete
  // UsePipes, // Não é mais necessário importar localmente se global está ativo
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Supondo que você tenha um JwtAuthGuard

// @UseGuards(JwtAuthGuard) // Descomente quando o JwtAuthGuard estiver configurado
@Controller('folders')
@UseGuards() // Placeholder para o JwtAuthGuard. Remova ou substitua pelo seu AuthGuard.
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Removido, pipe global atua
  create(@Body() createFolderDto: CreateFolderDto, @Req() req) {
    // const userId = req.user.userId; // Substitua pela forma correta de obter o userId
    const userId = 'temp-user-id'; // Placeholder - SUBSTITUA PELA LÓGICA REAL DE AUTENTICAÇÃO
    return this.foldersService.create(createFolderDto, userId);
  }

  @Get()
  findAll(@Req() req) {
    // const userId = req.user.userId;
    const userId = 'temp-user-id'; // Placeholder - SUBSTITUA PELA LÓGICA REAL DE AUTENTICAÇÃO
    return this.foldersService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    // const userId = req.user.userId;
    const userId = 'temp-user-id'; // Placeholder - SUBSTITUA PELA LÓGICA REAL DE AUTENTICAÇÃO
    return this.foldersService.findOne(id, userId);
  }

  @Patch(':id')
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Removido, pipe global atua
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFolderDto: UpdateFolderDto,
    @Req() req,
  ) {
    // const userId = req.user.userId;
    const userId = 'temp-user-id'; // Placeholder - SUBSTITUA PELA LÓGICA REAL DE AUTENTICAÇÃO
    return this.foldersService.update(id, updateFolderDto, userId);
  }

  @Delete(':id')
  @HttpCode(204) // Retorna 204 No Content em caso de sucesso
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    // const userId = req.user.userId;
    const userId = 'temp-user-id'; // Placeholder - SUBSTITUA PELA LÓGICA REAL DE AUTENTICAÇÃO
    await this.foldersService.remove(id, userId);
    // Não é necessário retornar nada explicitamente com HttpCode(204)
  }
}