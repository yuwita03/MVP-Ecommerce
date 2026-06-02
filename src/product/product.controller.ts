import { Controller, UseGuards, Post, HttpCode, Body, Param, Patch, Delete, Get, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductRequest, ProductResponse, UpdateProductRequest, } from 'src/model/product.model';
import { Paging, WebResponse } from 'src/model/web.model';
import { Role } from 'src/common/roles.enum';
import { Roles } from 'src/common/Guards/roles.decorator';
import { RolesGuard } from 'src/common/Guards/roles.guard';

@Controller('/api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() request: CreateProductRequest): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.create(request);
    return { data: result }
  }

  @Patch('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id:string, @Body() request: UpdateProductRequest): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.update(id, request);
    return { data: result }
  }

  @Delete('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id:string): Promise<WebResponse<boolean>> {
    const result = await this.productService.delete(id);
    return { data: result }
  }

  @Get()
  @HttpCode(200)
  async getAll(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10
  ): Promise<WebResponse<{data: ProductResponse[]; paging: Paging}>> {
    const result = await this.productService.getAll(+page, +size);
    return { 
      data: result,
      paging: result.paging,}
  }

  @Get('/:id')
  @HttpCode(200)
  async getById(@Param('id') id:string): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.getById(id);
    return { data: result }
  }
}
