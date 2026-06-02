export class createCategoryRequest {
    name!: string;
    slug!: string;         // untuk URL SEO friendly
}

export class UpdateCategoryRequest {
    name?: string
    slug?: string;         // untuk URL SEO friendly
}

export class CategoryResponse {
    id!: string;
    name!: string;
    slug!: string;         // untuk URL SEO friendly
    createdAt!: Date;
}