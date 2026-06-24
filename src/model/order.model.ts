import { UserResponse } from "./user.model"
import { AddressResponse } from "./address.model"
import { Address } from "@prisma/client"

export class CheckoutRequest {
    addressId!: string
}

export class OrderItemResponse {
    id!: string
    productId!: string
    productName!: string
    quantity!: number
    price!: number
}

export class OrderResponse{
    id!: string
    status!: string
    totalPrice!: number
    addressId!: string
    address?: AddressResponse
    user?: UserResponse
    items!: OrderItemResponse[]
    createdAt!: Date
}