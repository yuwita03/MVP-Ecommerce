import { Inject, Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AddressValidation } from './address.validation';
import { Logger } from 'winston';
import { CreateAddressRequest, AddressResponse, UpdateAddressRequest } from 'src/model/address.model';
import { User } from '@prisma/client';

@Injectable()
export class AddressService {
    constructor(
        private readonly PrismaService: PrismaService,
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}
// user: User ditambahkan sebagai parameter untuk memastikan address yang dibuat terkait dengan user yang sedang login, dan untuk set userId di tabel address
    async create(user: User, request: CreateAddressRequest): Promise<AddressResponse>{
        this.logger.debug(`Creating address: ${JSON.stringify(request)}`);

        const createRequest = this.validationService.validate(
            AddressValidation.CREATE, request
        );

        // Kalau isDefault true, set semua address lain jadi false
        if (createRequest.isDefault){
            await this.PrismaService.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false },
            })
        }

        // Cek max address SEBELUM create
        const totalAddress = await this.PrismaService.address.count({
        where: { userId: user.id }
        });

        if (totalAddress >= 5) {
        throw new HttpException('Maximum 5 addresses allowed', 400);
        }

        // Explicit field supaya data kategori ikut di response
        const address = await this.PrismaService.address.create({
            data: {
                userId: user.id,
                name: createRequest.name,
                phone: createRequest.phone,
                street: createRequest.street,
                city: createRequest.city,
                province: createRequest.province,
                postalCode: createRequest.postalCode,
                isDefault: createRequest.isDefault ?? false, // default false kalau tidak dikirim
            }
        })



        return {
            id: address.id,
            name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
        }
    }
    async update(user: User, id: string, request: UpdateAddressRequest): Promise<AddressResponse> {
        this.logger.debug(`Updating address: ${JSON.stringify(request)}`);

        const updateRequest = this.validationService.validate(
            AddressValidation.UPDATE, request
        )

        const existing = await this.PrismaService.address.findFirst({
            where: { id, userId: user.id }
        });

        if(!existing){
            throw new HttpException('Address not found', 404);
        }
        // Kalau isDefault true, set semua address lain jadi false dlu
        if(updateRequest.isDefault){
            await this.PrismaService.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false },
            })
        }
        const address = await this.PrismaService.address.update({
            where: { id },
            data: {
                name: updateRequest.name,
                phone: updateRequest.phone,
                street: updateRequest.street,
                city: updateRequest.city,
                province: updateRequest.province,
                postalCode: updateRequest.postalCode,
                isDefault: updateRequest.isDefault,
            }
        })
        return {
            id: address.id,
            name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
        }
    }
    async delete(user: User, id: string): Promise<boolean> {
        this.logger.debug(`Deleting address with id: ${id}`);

        const existing = await this.PrismaService.address.findFirst({
            where: { id, userId: user.id }
        });

        if(!existing){
            throw new HttpException('Address not found', 404);
        }

        await this.PrismaService.address.delete({
            where: { id }
        })
        return true;
    }
    async getAll(user: User): Promise<AddressResponse[]> {
        this.logger.debug(`Getting all addresses for user with id: ${user.id}`);
        const address = await this.PrismaService.address.findMany({
            where: { userId: user.id }
        });
        return address.map(address => ({
            id: address.id,
            name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
        }))
    }
    async getById(user: User, id: string): Promise<AddressResponse>{
        this.logger.debug(`Getting address by id: ${id}`);
        const address = await this.PrismaService.address.findFirst({
            where: { id, userId: user.id }
        });
        if(!address){
            throw new HttpException('Address not found', 404);
        }
        return {
            id: address.id,
            name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
        }
    }
}
