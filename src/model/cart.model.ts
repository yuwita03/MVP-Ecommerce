// model/cart.model.ts
import { ProductResponse } from './product.model';

export class AddToCartRequest {
  productId!: string;
  quantity!: number;
}

export class UpdateCartItemRequest {
  quantity!: number;
}

export class CartItemResponse {
  id!: string;
  productId!: string;
  product!: ProductResponse;
  quantity!: number;
}

export class CartResponse {
  id!: string;
  items!: CartItemResponse[];
}