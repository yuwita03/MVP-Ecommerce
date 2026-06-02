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
    items!: OrderItemResponse[]
    createdAt!: Date
}