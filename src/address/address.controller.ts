import { Controller, HttpCode, Post, Body, Patch, Param, Delete, Get } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressResponse, CreateAddressRequest, UpdateAddressRequest} from 'src/model/address.model';
import { WebResponse } from 'src/model/web.model';
import { Auth } from '../common/Auth/auth.decorator';
import type { User } from '@prisma/client';

@Controller('/api/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @HttpCode(200)
  async create(
    @Auth() user: User,
    @Body() request: CreateAddressRequest,
  ): Promise<WebResponse<AddressResponse>> {
    const result = await this.addressService.create(user, request);
    return { data: result };
  }

  @Patch('/:id')
  @HttpCode(200)
  async update(
    @Auth() user: User,
    @Param('id') id: string,
    @Body() request: UpdateAddressRequest,
  ): Promise<WebResponse<AddressResponse>> {
    const result = await this.addressService.update(user, id, request);
    return { data: result };
  }

  @Delete('/:id')
  @HttpCode(200)
  async delete(
    @Auth() user: User,
    @Param('id') id: string,
  ): Promise<WebResponse<boolean>>{
    const result = await this.addressService.delete(user, id);
    return { data: result };
  }

  @Get()
  @HttpCode(200)
  async getAll(
    @Auth() user: User,
  ): Promise<WebResponse<AddressResponse[]>>{
    const result = await this.addressService.getAll(user);
    return { data: result };
  }

  @Get('/:id')
  @HttpCode(200)
  async getById(
    @Auth() user: User,
    @Param('id') id: string,
  ): Promise<WebResponse<AddressResponse>>{
    const result = await this.addressService.getById(user, id);
    return { data: result };
  }

  @Patch('/:id/default')
  @HttpCode(200)
  async setDefault(
    @Auth() user: User,
    @Param('id') id:string,
  ): Promise<WebResponse<AddressResponse>>{
    const result = await this.addressService.update(user,id, {isDefault: true});
    return { data: result };
  }
  
}
