import { CategoryResponse } from "./category.model";

export class CreateProductRequest {
  name!: string;
  description?: string;  // opsional
  price!: number;
  stock!: number;
  image?: string;        // opsional, bisa upload nanti
  slug!: string;         // untuk URL SEO friendly
  isActive?: boolean;    // default true
  categoryId!: string;   // wajib, relasi ke kategori
}

export class UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  slug?: string;
  isActive?: boolean;
  categoryId?: string; 
}

export class ProductResponse {
  id!: string;
  name!: string
  description?: string;
  price!: number;
  stock!: number;
  image?: string;
  slug!: string;
  isActive!: boolean;
  categoryId!: string;
  category?: CategoryResponse; // relasi kategori
  createdAt!: Date;
}