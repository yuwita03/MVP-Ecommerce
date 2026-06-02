import { Injectable, HttpException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { CreateProductRequest, ProductResponse, UpdateProductRequest } from 'src/model/product.model';
import { ProductValidation } from './product.validation';
import {Paging} from 'src/model/web.model';

@Injectable()
export class ProductService {
  constructor(
    private PrismaService: PrismaService,
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(request: CreateProductRequest): Promise<ProductResponse> {
    this.logger.debug(`Creating product: ${JSON.stringify(request)}`);

    // Validasi input dari client
    const createRequest = this.validationService.validate(
      ProductValidation.CREATE, request
    );

    // Cek slug sudah dipakai produk lain
    const existing = await this.PrismaService.product.findUnique({
      where: { slug: createRequest.slug },
    });
    if (existing) {
      throw new HttpException('Product with the same slug already exists', 400);
    }

    // Cek kategori valid sebelum create
    const category = await this.PrismaService.category.findUnique({
      where: { id: createRequest.categoryId },
    });
    if (!category) {
      throw new HttpException('Category not found', 404);
    }

    // Buat produk, include category supaya data kategori ikut di response explicit field
    const product = await this.PrismaService.product.create({
      data: {
        name: createRequest.name,
        description: createRequest.description,
        price: createRequest.price,
        stock: createRequest.stock,
        image: createRequest.image,
        slug: createRequest.slug,
        isActive: createRequest.isActive ?? true, // default true kalau tidak dikirim
        categoryId: createRequest.categoryId,
      },
      include: { category: true },
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined, // null → undefined
      price: Number(product.price),                  // Decimal → number
      stock: product.stock,
      image: product.image ?? undefined,             // null → undefined
      slug: product.slug,
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        createdAt: product.category.createdAt,
      },
      createdAt: product.createdAt,
    };
  }
  async update(id: string, request: UpdateProductRequest): Promise<ProductResponse> {
    this.logger.debug(`Updating product ${id}: ${JSON.stringify(request)}`);

    // Validasi input dari client
    const updateRequest = this.validationService.validate(
        ProductValidation.UPDATE, request
    )

    // Cek produk yang mau diupdate ada atau tidak
    const existing = await this.PrismaService.product.findUnique({
        where: { id },
    })
    if(!existing){
        throw new HttpException('Product not found', 404);
    }

    // Kalau update slug, cek slug sudah dipakai produk lain
    if(updateRequest.slug){
        const slugExist = await this.PrismaService.product.findUnique({
            where: { slug: updateRequest.slug },
        });
        if(slugExist){
            throw new HttpException('Product with the same slug already exists', 400);
        }
    }

    // Cek kategori valid sebelum update
    if(updateRequest.categoryId){
        const category = await this.PrismaService.category.findUnique({
            where: { id: updateRequest.categoryId },
        });
        if(!category){
            throw new HttpException('Category not found', 404);
        }
    }

    const product = await this.PrismaService.product.update({
        where: { id },
        data: {
            name: updateRequest.name,
            description: updateRequest.description,
            price: updateRequest.price,
            stock: updateRequest.stock,
            image: updateRequest.image,
            slug: updateRequest.slug,
            isActive: updateRequest.isActive,
            categoryId: updateRequest.categoryId,
        },
        include: { category: true },
    });
    return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: Number(product.price),
        stock: product.stock,
        image: product.image ?? undefined,
        slug: product.slug,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.category,
        createdAt: product.createdAt,
    };
  }
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting product ${id}`);

    // Cek produk yang mau diupdate ada atau tidak
    const existing = this.PrismaService.product.findUnique({
        where: { id },
    })

    if(!existing){
        throw new HttpException('Product not found', 404);
    }

    await this.PrismaService.product.delete({
        where: { id },
    });
    return true;
  }
  async getAll(page: number=1, size: number=10): Promise<{ data: ProductResponse[]; paging: Paging }>{
    this.logger.debug(`Getting all products`);

    // Untuk pagination, ambil data dan total count secara bersamaan
    const [products, total] = await Promise.all([
        this.PrismaService.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * size,
            take: size,
        }),
        this.PrismaService.product.count(),
    ]);

    return {
      data: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: Number(product.price),
        stock: product.stock,
        image: product.image ?? undefined,
        slug: product.slug,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          createdAt: product.category.createdAt,
        },
        createdAt: product.createdAt,
      })),
      paging: {
        page,
        size,
        totalPage: Math.ceil(total / size),
      },
    };
  }
  async getById(id: string): Promise<ProductResponse>{
    this.logger.debug(`Getting product by id: ${id}`);

    const product = await this.PrismaService.product.findUnique({
        where: { id },
        include: { category: true },
    });

    if (!product) {
        throw new HttpException('Product not found', 404);
    }

    return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: Number(product.price),
        stock: product.stock,
        image: product.image ?? undefined,
        slug: product.slug,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            createdAt: product.category.createdAt,
        },
        createdAt: product.createdAt,
    };
  }
}