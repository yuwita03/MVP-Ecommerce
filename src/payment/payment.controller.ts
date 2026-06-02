import { Controller, HttpCode, Post, Param, Body, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { WebResponse } from 'src/model/web.model';
import { Auth } from 'src/common/Auth/auth.decorator';
import type { User } from '@prisma/client';

@Controller('/api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/:orderId')
  @HttpCode(200)
  async createPayment (
    @Auth() user: User,
    @Param('orderId') orderId: string,
  ): Promise<WebResponse<{token: string; redirectUrl: string}>>{
    const result = await this.paymentService.createPayment(orderId)
    return{data:result}
  }

  @Post('/webhook')
  @HttpCode(200)
  async handleWebHook(@Body() notification: any): Promise<WebResponse<boolean>>{
    const result = await this.paymentService.handleWebHook(notification)
    return { data: result }
  }
}
