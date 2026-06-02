import { Body, Controller, Get, HttpCode, Param, Post, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartRequest, CartResponse, UpdateCartItemRequest } from 'src/model/cart.model';
import { Auth } from '../common/Auth/auth.decorator';
import type { User } from '@prisma/client';
import { WebResponse } from 'src/model/web.model';
import { Roles } from 'src/common/Guards/roles.decorator';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { OrderResponse } from 'src/model/order.model';
import { size } from 'zod';

@Controller('/api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // User login - tambah produk ke cart
  @Post()
  @HttpCode(200)
  async addToCart(
    @Auth() user: User,
    @Body() request: AddToCartRequest
  ):Promise<WebResponse<CartResponse>> {
    const result = await this.cartService.addToCart(user, request);
    return {data: result};
  }

  @Get()
  @HttpCode(200)
  async getCart(
    @Auth() user: User
  ): Promise<WebResponse<CartResponse>> {
    const result = await this.cartService.getCart(user);
    return {data: result};
  }

  @Patch('/:itemId')
  @HttpCode(200)
  async updateItem(
    @Auth() user: User,
    @Param('itemId') itemId: string,
    @Body() request: UpdateCartItemRequest
  ): Promise<WebResponse<CartResponse>> {
    await this.cartService.updateItem(user, itemId, request);
    return this.getCart(user);
  }

  @Delete('/:itemId')
  @HttpCode(200)
  async removeItem(
    @Auth() user: User,
    @Param('itemId') itemId: string
  ): Promise<WebResponse<CartResponse>> {
    const result = await this.cartService.removeItem(user, itemId);
    return {data: result};
  }

  @Delete()
  @HttpCode(200)
  async clearItem(
    @Auth() user: User
  ): Promise<WebResponse<boolean>> {
    const result = await this.cartService.clearItem(user);
    return {data: result};
  }


}

