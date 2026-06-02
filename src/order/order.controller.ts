import { Controller, HttpCode, Post, Body, Get, Param, Delete, UseGuards, Query, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { Auth } from 'src/common/Auth/auth.decorator';
import { OrderResponse, CheckoutRequest } from 'src/model/order.model';
import { Paging, WebResponse } from 'src/model/web.model';
import type { User } from '@prisma/client';
import { Roles } from 'src/common/Guards/roles.decorator';
import { Role } from 'src/common/roles.enum';
import { RolesGuard } from 'src/common/Guards/roles.guard';

@Controller('/api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(200)
  async checkout(
    @Auth() user: User,
    @Body() request: CheckoutRequest
  ): Promise<WebResponse<OrderResponse>> {
    const result = await this.orderService.checkout(user, request);
    return { data: result };
  }

  @Get()
  @HttpCode(200)
  async getAll(
    @Auth() user: User,
  ): Promise<WebResponse<OrderResponse[]>>{
    const result = await this.orderService.getOrders(user)
    return {data: result}
  }

  @Get('/admin')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllAdmin (
    @Query('page') page:number =1,
    @Query('size') size:number =10,
  ): Promise<WebResponse<OrderResponse[]>>{
    const result = await this.orderService.getOrdersAdmin(+page, +size);
    return {
      data: result.data,
      paging: result.paging
    }
  }

  
  @Patch('/admin/:orderId/status')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string }
  ): Promise<WebResponse<OrderResponse>>{
    const result = await this.orderService.updateStatus(orderId, body.status)
    return { data: result }
  }


  @Get('/:id')
  @HttpCode(200)
  async getById(
    @Auth() user: User,
    @Param('id') id: string
  ): Promise<WebResponse<OrderResponse>>{
    const result = await this.orderService.getById(id)
    return {data: result}
  }

  @Delete('/:orderId/cancel')
  @HttpCode(200)
  async delete(
    @Auth() user: User,
    @Param('orderId') orderId: string,
  ): Promise<WebResponse<boolean>>{
    const result = await this.orderService.cancelOrder(user, orderId);
    return { data: result}
  }

}
