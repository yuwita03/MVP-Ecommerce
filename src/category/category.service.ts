import { Injectable, HttpException } from '@nestjs/common';
import { createCategoryRequest, UpdateCategoryRequest } from 'src/model/category.model';
import { CategoryValidation } from './category.validation';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from 'src/common/prisma.service';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CategoryResponse } from 'src/model/category.model';


@Injectable()
export class CategoryService {
    constructor(
        private PrismaService: PrismaService,
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}
    async create(request: createCategoryRequest): Promise<CategoryResponse>{
        this.logger.debug(`Creating category: ${JSON.stringify(request)}`);
        const createRequest: createCategoryRequest = this.validationService.validate(
            CategoryValidation.CREATE, request
        );

        const existing = await this.PrismaService.category.findFirst({
            where: {
                OR : [
                    { name: createRequest.name },
                    { slug: createRequest.slug }
                ]
            }
        });
        if(existing){
            throw new Error('Category with the same name or slug already exists');
        }
        const category = await this.PrismaService.category.create({
            data: createRequest
        })
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt
        };
    }
    async update(request: UpdateCategoryRequest, id: string): Promise<CategoryResponse> {
        this.logger.debug(`Updating category with id: ${id}, data: ${JSON.stringify(request)}`);
        const updateRequest: UpdateCategoryRequest = this.validationService.validate(
            CategoryValidation.UPDATE, request
        );
        const existing = await this.PrismaService.category.findUnique({
            where: { id }
        });
        if(!existing){
            throw new HttpException('Category not found', 404);
        }
        const category = await this.PrismaService.category.update({
            where: { id },
            data: updateRequest
        });
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt
        };
    }
    // Delete category by id
    async delete(id: string): Promise<boolean> {
        this.logger.debug(`Deleting category with id: ${id}`);
        // Check if category exists
        const existing = await this.PrismaService.category.findUnique({
            where:{ id }
        });
        if(!existing){
            throw new HttpException('Category not found', 404);
        }
        await this.PrismaService.category.delete({
            where: {
                id
            }
        })
        return true;
    }
    async getAll(): Promise<CategoryResponse[]> {
        this.logger.debug(`Getting all categories`);
        const categories = await this.PrismaService.category.findMany();
        return categories.map(category =>({
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt
        }))
    }
    async getById(id: string): Promise<CategoryResponse>{
        this.logger.debug(`Getting category by id: ${id}`);
        const category = await this.PrismaService.category.findUnique({
            where: { id }
        });
        if(!category){
            throw new HttpException('Category not found', 404);
        }
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt
        };
    }
}
    