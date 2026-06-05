import { Controller, HttpCode, Post, Param, Body, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { WebResponse } from 'src/model/web.model';
import { Auth } from 'src/common/Auth/auth.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('/api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}


  @ApiOperation({ summary: 'Webhook Midtrans' })
  @Post('/webhook')
  @HttpCode(200)
  async handleWebHook(@Body() notification: any): Promise<WebResponse<boolean>>{
    const result = await this.paymentService.handleWebHook(notification)
    return { data: result }
  }

  
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat pembayaran Midtrans' })
  @Post('/:orderId')
  @HttpCode(200)
  async createPayment (
    @Auth() user: User,
    @Param('orderId') orderId: string,
  ): Promise<WebResponse<{token: string; redirectUrl: string}>>{
    const result = await this.paymentService.createPayment(orderId)
    return{data:result}
  }
}
