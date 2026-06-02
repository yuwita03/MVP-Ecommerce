import { Injectable, Inject, HttpException } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OrderValidation } from './order.validation';
import { CheckoutRequest, OrderResponse } from 'src/model/order.model';
import { Order, OrderStatus, User } from '@prisma/client';
import { Paging } from 'src/model/web.model';

@Injectable()
export class OrderService {
  constructor(
    private readonly PrismaService: PrismaService,
    private readonly validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async checkout(user: User, request: CheckoutRequest) {
    this.logger.info(`Processing checkout for user ${user.id}`);

    // Validasi input
    const checkoutRequest = this.validationService.validate(
      OrderValidation.CheckoutRequest, { addressId: request.addressId }
    );

    // Cek address ada dan milik user yang login
    const address = await this.PrismaService.address.findFirst({
      where: { id: checkoutRequest.addressId, userId: user.id },
    });
    if (!address) throw new HttpException('Address not found', 404);

    // Ambil cart beserta items dan data produk
    const cart = await this.PrismaService.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true }, // sertakan data produk tiap item
        },
      },
    });

    // Cart harus ada dan tidak kosong
    if (!cart || cart.items.length === 0) {
      throw new HttpException('Cart is empty', 400);
    }

    // Cek stok semua produk sebelum checkout
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new HttpException(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    // Hitung total harga dari semua item di cart
    const totalPrice = cart.items.reduce((total, item) => {
      return total + Number(item.product.price) * item.quantity;
    }, 0);

    // Buat order beserta order items sekaligus
    const order = await this.PrismaService.order.create({
      data: {
        userId: user.id,
        addressId: checkoutRequest.addressId,
        totalPrice,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.product.price), // simpan harga saat order, bukan harga sekarang
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Kurangi stok produk setelah order dibuat
    for (const item of cart.items) {
      await this.PrismaService.product.update({
        where: { id: item.productId },
        data: { stock: item.product.stock - item.quantity },
      });
    }

    // Kosongkan cart setelah checkout berhasil
    await this.PrismaService.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      addressId: order.addressId,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      createdAt: order.createdAt,
    };
  }
  async getOrders(user: User): Promise<OrderResponse[]>{
    this.logger.debug(`Getting orders for ${user.username}`)

    const orders = await this.PrismaService.order.findMany({
      where: { userId: user.id},
      orderBy: { createdAt: 'desc'},
      include: {
        items: {
          include: {  product: true}
        }
      }
    });

  return orders.map(order => ({
    id: order.id,
    status: order.status,
    totalPrice: Number(order.totalPrice),
    addressId: order.addressId,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    createdAt: order.createdAt,
  }));
  }
  async getById(id: string): Promise<OrderResponse>{
    this.logger.debug(`Gettng product by id: ${id}`)

    const order = await this.PrismaService.order.findUnique({
      where: {id},      
      include: {
        items: {
          include: { product: true }, // sertakan data produk tiap item
        },
      },
    });

    if(!order){
      throw new HttpException('Product not found', 404)
    }
    return {
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      addressId: order.addressId,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      createdAt: order.createdAt,
    }; 
  }
  async cancelOrder(user: User, orderId: string): Promise<boolean> {
  this.logger.debug(`Cancelling order: ${orderId}`);

  const order = await this.PrismaService.order.findFirst({
    where: { id: orderId, userId: user.id }, // cari seusai data yang ingin di cari
  });

  if (!order) throw new HttpException('Order not found', 404); //kalo order g ada data

  // Hanya bisa cancel kalau status masih PENDING
  if (order.status !== 'PENDING') {
    throw new HttpException('Order cannot be cancelled', 400);
  }

  await this.PrismaService.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });// dari pada delete mending update

  return true;
  }
  async getOrdersAdmin (page: number=1, size: number=10): Promise<{data: OrderResponse[]; paging: Paging}>{

    const skip = (page - 1) * size

    const [orders, total] = await Promise.all([
      this.PrismaService.order.findMany({
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },// urutkan dari order terbaru
        include:{
          items:{ //relasi dalam table database item itemOrder[]
            include:{ product: true } // setiap orderItem[] sertakan data product
          }
        },
      }),
      this.PrismaService.order.count(),
    ]);
    return {
      data: orders.map(order => this.mapOrderResponse(order)),
      paging: {
        page,
        size,
        totalPage: Math.ceil(total/size),
      }
    }
  }
  // helper — hindari duplikasi map order response
  private mapOrderResponse(order: any): OrderResponse{
    return{
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      addressId: order.addressId,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      createdAt: order.createdAt,
    }; 
  }
  async updateStatus(orderId: string, status: string): Promise<OrderResponse>{
    this.logger.debug(`Updating order status: ${orderId} to ${status}`)

    const order = await this.PrismaService.order.findUnique({
      where: {id: orderId}
    })

    if(!order) throw new HttpException('Order not found', 404)

    const updated = await this.PrismaService.order.update({
      where: {id: orderId},
      data: {status: status as OrderStatus},
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

  return this.mapOrderResponse(updated)
  }
  }
