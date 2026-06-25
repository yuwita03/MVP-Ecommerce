import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { Snap } from 'midtrans-client';
import { OrderStatus } from '@prisma/client';
import { Logger } from 'winston'

@Injectable()
export class PaymentService {
    private snap: Snap;

    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
    ){
        this.snap = new Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY!,
            clientKey: process.env.MIDTRANS_CLIENT_KEY!,
        })
    }

    async createPayment(orderId: string): Promise<{ token: string; redirectUrl: string}>{
        this.logger.debug(`Creating payment for order: ${orderId}`)

        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: { include: {product: true }}
            }
        });

        if(!order) throw new HttpException('Order not Found', 404);
        if (order.status !== 'PENDING') throw new HttpException('Order is not pending', 404);

        // Kalau token masih valid, return langsung
        if (order.snapToken && order.snapUrl && order.snapTokenExpiredAt) {
            if (order.snapTokenExpiredAt > new Date()) {
                return {
                    token: order.snapToken,
                    redirectUrl: order.snapUrl,
                }
            }
        }

        const transaction = await this.snap.createTransaction({
            transaction_details:{
                order_id: order.id,
                gross_amount: Number(order.totalPrice)
            },
            customer_details:{
                first_name: order.user.name,
                email: order.user.email,
            },
            item_details: order.items.map(items => ({
                id: items.productId,
                name: items.product.name,
                price: Number(items.price),
                quantity: items.quantity
            })),
        });

        // Simpan token ke DB
        await this.prismaService.order.update({
            where: { id: orderId },
            data: {
                snapToken: transaction.token,
                snapUrl: transaction.redirect_url,
                snapTokenExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
        })

        return {
            token: transaction.token,
            redirectUrl: transaction.redirect_url
        }
    }

    async handleWebHook(notifictaion: any): Promise<boolean>{
        this.logger.debug(`Handling webhook: ${JSON.stringify(notifictaion)}`)

        const statusResponse = await this.snap.transaction.notification(notifictaion)

        const orderId = statusResponse.order_id
        this.logger.debug(`ORDER ID FROM MIDTRANS: ${orderId}`)

        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status

        let orderStatus: OrderStatus;

        if(transactionStatus === 'capture' && fraudStatus === 'accept'){
            orderStatus = OrderStatus.PAID
        }else if (transactionStatus === 'settlement'){
            orderStatus = OrderStatus.PAID
        }else if (transactionStatus === 'cancel' || transactionStatus === 'expire'){
            orderStatus = OrderStatus.CANCELLED
        }else{
            orderStatus = OrderStatus.PENDING
        }

        // Cek order ada gak sebelum update
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            this.logger.debug(`Order not found: ${orderId}`)
            return true
        }

        await this.prismaService.order.update({
            where: { id: orderId },
            data: { status: orderStatus }
        })

        return true
    }
}