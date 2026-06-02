import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CartValidation } from './cart.validation';
import { request } from 'https';
import { AddToCartRequest, CartResponse, UpdateCartItemRequest } from '../model/cart.model';
import { User } from '@prisma/client';


@Injectable()
export class CartService {
    constructor(
        private readonly PrismaService: PrismaService,
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
    ) {}
    async addToCart(user: User, request: AddToCartRequest) {
        this.logger.info(`Adding product ${request.productId} with quantity ${request.quantity} to cart for user ${user.id}`);

        // Validate input
        const addRequest = this.validationService.validate(
            CartValidation.ADD, request
        );

        // Check if the product exists
        const product = await this.PrismaService.product.findUnique({
            where: { id: addRequest.productId },
        });

        if(!product) throw new HttpException('Product not found', 404);
        if(!product.isActive) throw new HttpException('Product is not available', 400);
        if(product.stock < addRequest.quantity) throw new HttpException('Insufficient stock', 400);

        // Check if the user has an active cart
        let cart = await this.PrismaService.cart.findUnique({
            where: {userId: user.id},
        })
        if(!cart) {
            cart = await this.PrismaService.cart.create({
                data: {userId: user.id}
            })
        }
        const existingItem = await this.PrismaService.cartItem.findFirst({
            where: { cartId: cart.id, productId: addRequest.productId }
        });
        if(existingItem) {
            await this.PrismaService.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + addRequest.quantity }
            })
        } else {
            await this.PrismaService.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: addRequest.productId,
                    quantity: addRequest.quantity
                },
            });
        }
        return this.getCart(user);
    }
    async getCart(user: User): Promise<CartResponse> {
        this.logger.info(`Retrieving cart for user ${user.id}`);
        const cart = await this.PrismaService.cart.findUnique({
            where: { userId: user.id },
            include: {
                items:{ // relasi items CartItem[]
                    include: { product: true} // setiap CartItem[] berikan data product
                }
            }
        });

        if(!cart) return { id: '', items: [] };

        return {
            id: cart.id,
            items: cart.items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: Number(item.product.price),
                    stock: item.product.stock,
                    image: item.product.image ?? undefined,
                    slug: item.product.slug,
                    isActive: item.product.isActive,
                    categoryId: item.product.categoryId,
                    createdAt: item.product.createdAt,
                }
            }))
    }
    }
    async updateItem(user: User, ItemId: string, request: UpdateCartItemRequest) {
        this.logger.info(`Updating cart item ${ItemId} for user ${user.id} with quantity ${request.quantity}`);

        const updateRequest = this.validationService.validate(
            CartValidation.UPDATE, request
        )

        const item = await this.PrismaService.cartItem.findFirst({
            where: { 
                id: ItemId,
                cart: { userId: user.id },
            }
        })
        if(!item) throw new HttpException('Cart item not found', 404);

        const product = await this.PrismaService.product.findUnique({
            where: { id: item.productId },
        })

        if(product!.stock < updateRequest.quantity) throw new HttpException('Insufficient stock', 400);

        await this.PrismaService.cartItem.update({
            where: { id: item.id },
            data: { quantity: updateRequest.quantity }
        })

        return this.getCart(user);
    }
    async removeItem(user: User, ItemId: string): Promise<CartResponse>{
        this.logger.info(`Removing cart item ${ItemId} for user ${user.id}`);

        const item = await this.PrismaService.cartItem.findFirst({
            where:{
                id: ItemId,
                cart: { userId: user.id },
            }
        })

        if(!item) throw new HttpException('Cart item not found', 404);

        await this.PrismaService.cartItem.delete({
            where: { id: item.id }
        })

        return this.getCart(user);
    }
    async clearItem(user: User): Promise<boolean> {
        this.logger.info(`Clearing cart for user ${user.id}`);

        const cart = await this.PrismaService.cart.findUnique({
            where: { userId: user.id },
        })

        if(!cart) throw new HttpException('Cart not found', 404);

        await this.PrismaService.cartItem.deleteMany({
            where: { cartId: cart.id }
        })

        return true
    }
}
