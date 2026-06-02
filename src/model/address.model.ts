export class CreateAddressRequest {
  name!: string;
  phone!: string;
  street!: string;
  city!: string;
  province!: string;
  postalCode!: string;
  isDefault?: boolean;
}

export class UpdateAddressRequest {
    name?: string;
    phone?: string;
    street?: string
    city?: string;
    province?: string
    postalCode?: string;
    isDefault?: boolean;
}

export class AddressResponse {
    id!: string
    name!: string;
    phone!: string;
    street!: string
    city!: string;
    province!: string;
    postalCode!: string
    isDefault!: boolean;
    createdAt!: Date;
}