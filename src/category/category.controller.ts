import { Controller, HttpCode, UseGuards, Body, Post, Patch, Param, Delete, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResponse, createCategoryRequest, UpdateCategoryRequest } from 'src/model/category.model';
import { Role } from 'src/common/roles.enum';
import { Roles } from 'src/common/Guards/roles.decorator';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { WebResponse } from '../model/web.model';

@Controller('/api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  //Admin only
  @Post()
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() request: createCategoryRequest): Promise<CategoryResponse> {
    const result = await this.categoryService.create(request);
    return result;
  }

  @Patch('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id:string,
    @Body() request: UpdateCategoryRequest): Promise<WebResponse<CategoryResponse>> {
      const result = await this.categoryService.update(request, id);
      return { data: result };
  }

  @Delete('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string): Promise<WebResponse<boolean>>{
    const result = await this.categoryService.delete(id);
    return { data: result };
  }

  @Get()
  @HttpCode(200)
  async getAll(): Promise<WebResponse<CategoryResponse[]>> {
    const result = await this.categoryService.getAll();
    return { data: result };
  }

  @Get('/:id')
  @HttpCode(200)
  async getById(@Param('id') id: string): Promise<WebResponse<CategoryResponse>> {
    const result = await this.categoryService.getById(id);
    return { data: result };
  }
}
