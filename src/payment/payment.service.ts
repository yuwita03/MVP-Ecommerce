import { HttpException, Inject, Injectable } from '@nestjs/common';
// import * as midtransClient from 'midtrans-client'
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
    // Snap adalah produk Midtrans untuk payment page
    // isProduction: false = sandbox (testing), true = production (uang asli)
        this.snap = new Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true', // env cofiguration
            serverKey: process.env.MIDTRANS_SERVER_KEY!,    // key rahasia, jangan share
            clientKey: process.env.MIDTRANS_CLIENT_KEY!,    // key untuk frontend
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
        // Hanya order PENDING yang bisa dibayar
        if (order.status !== 'PENDING') throw new HttpException('Order is not pending', 404);

        // Kirim data transaksi ke midtrans
        // Midtrans akan return token dan URL halam pembayaran
        // Note harus di tambahkan decorator library nya di types/midtrans-client.d.ts
        const transaction = await this.snap.createTransaction({
            transaction_details:{
                order_id: order.id,       // Id unik transaksinya
                gross_amount: Number(order.totalPrice) // total harga bayar nya
            },
            customer_details:{
                first_name: order.user.name,
                email: order.user.email,
            },
            item_details: order.items.map(items => ({
                id: items.productId,
                name: items.product.name,
                price: Number(items.price), // Harga per item
                quantity: items.quantity
            })),
        });

        return {
            token: transaction.token,   // token untuk Midtrans.js di frontend
            redirectUrl: transaction.redirect_url   // URL halaman pembayaran Midtrans
        }
    }

    async handleWebHook(notifictaion: any): Promise<boolean>{
        this.logger.debug(`Handling webhook: ${JSON.stringify(notifictaion)}`)

        // Webhook = notifikasi otomatis dari Midtrans setelah user bayar
        // Verifikasi dulu notifikasinya asli dari Midtrans
        const statusResponse = await this.snap.transaction.notification(notifictaion)

        const orderId = statusResponse.order_id
        const transactionStatus = statusResponse.transaction_status; //status dari Midtrans
        const fraudStatus = statusResponse.fraud_status // deteksi penipuan

        // ubah tipe
        let orderStatus: OrderStatus;

        // capture + accept = pembayaran kartu kredit berhasil dan tidak fraud
        if(transactionStatus === 'capture' && fraudStatus === 'accept'){
            orderStatus = OrderStatus.PAID
        }else if (transactionStatus === 'settlement'){
            orderStatus = OrderStatus.PAID
        }// cancel/expire = pembayaran dibatalkan atau waktu habis
        else if (transactionStatus === 'cancel' || transactionStatus === 'expire'){
            orderStatus = OrderStatus.CANCELLED
        }else{
            orderStatus = OrderStatus.PENDING
        }
        // kek di db buat update
        await this.prismaService.order.update({
            where: { id: orderId },
            data: { status: orderStatus}
        })
        return true
}
}