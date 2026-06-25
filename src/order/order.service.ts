import { Injectable, Inject, HttpException } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OrderValidation } from './order.validation';
import { CheckoutRequest, OrderResponse } from 'src/model/order.model';
import { User, OrderStatus } from '@prisma/client';
import { Paging } from 'src/model/web.model';

@Injectable()
export class OrderService {
  constructor(
    private readonly PrismaService: PrismaService,
    private readonly validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // HELPER - Menghindari Duplikasi Map Response
  private mapOrderResponse(order: any): OrderResponse {
    return {
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      addressId: order.addressId,
      address: order.address ? {
        id: order.address.id,
        name: order.address.name,
        phone: order.address.phone,
        street: order.address.street,
        city: order.address.city,
        province: order.address.province,
        postalCode: order.address.postalCode,
        isDefault: order.address.isDefault ?? false, 
        createdAt: order.address.createdAt,            
      } : undefined,
      user: {
        id: order.user.id,
        username: order.user.username,
        name: order.user.name,
        email: order.user.email,
        role: order.user.role,
      },
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      createdAt: order.createdAt,
    };
  }

  // USER METHODS
  async checkout(user: User, request: CheckoutRequest): Promise<OrderResponse> {
    this.logger.info(`Processing checkout for user ${user.id}`);

    // Validasi input
    const checkoutRequest = this.validationService.validate(
      OrderValidation.CheckoutRequest, 
      { addressId: request.addressId }
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
          include: { product: true },
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
            price: Number(item.product.price),
          })),
        },
      },
      include: {
        user: true, // Disertakan agar bisa diproses oleh mapOrderResponse
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
    return this.mapOrderResponse(order);
  }

  async getOrders(user: User): Promise<OrderResponse[]> {
    this.logger.debug(`Getting orders for ${user.username}`);
    const orders = await this.PrismaService.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true, // Disertakan agar bisa diproses oleh mapOrderResponse
        items: {
          include: { product: true }
        }
      }
    });
    return orders.map(order => this.mapOrderResponse(order));
  }

  async getById(id: string): Promise<OrderResponse> {
    this.logger.debug(`Getting order by id: ${id}`);
    const order = await this.PrismaService.order.findUnique({
      where: { id },      
      include: {
        user: true,
        address:true,
        items: {
          include: { product: true },
        },
      },
    });
    if (!order) {
      throw new HttpException('Order not found', 404);
    }
    return this.mapOrderResponse(order);
  }

  async cancelOrder(user: User, orderId: string): Promise<boolean> {
    this.logger.debug(`Cancelling order: ${orderId}`);
    const order = await this.PrismaService.order.findFirst({
      where: { id: orderId, userId: user.id },
    });
    if (!order) throw new HttpException('Order not found', 404);
    // Hanya bisa cancel kalau status masih PENDING
    if (order.status !== 'PENDING') {
      throw new HttpException('Order cannot be cancelled', 400);
    }
    await this.PrismaService.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
    return true;
  }
  // ADMIN METHODS

  async getOrdersAdmin(page: number = 1, size: number = 10): Promise<{ data: OrderResponse[]; paging: Paging }> {
    const skip = (page - 1) * size;
    const [orders, total] = await Promise.all([
      this.PrismaService.order.findMany({
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true, // Harus ada biar funsgi map nya g kedapetan data
          items: {
            include: { product: true }
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
        totalPage: Math.ceil(total / size),
      }
    };
  }

  async updateStatus(orderId: string, status: string): Promise<OrderResponse> {
    this.logger.debug(`Updating order status: ${orderId} to ${status}`);
    const order = await this.PrismaService.order.findUnique({
      where: { id: orderId }
    });
    if (!order) throw new HttpException('Order not found', 404);
    const updated = await this.PrismaService.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        user: true, // WAJIB ADA: Menghindari runtime error 'Cannot read properties of undefined (reading id)'
        items: {
          include: {
            product: true
          }
        }
      }
    });
    return this.mapOrderResponse(updated);
  }
}