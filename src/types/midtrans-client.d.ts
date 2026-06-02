declare module 'midtrans-client' {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    createTransaction(parameter: {
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      customer_details?: {
        first_name?: string;
        email?: string;
        phone?: string;
      };
      item_details?: {
        id: string;
        name: string;
        price: number;
        quantity: number;
      }[];
    }): Promise<{
      token: string;
      redirect_url: string;
    }>;
    transaction: {
      notification(notification: any): Promise<any>;
    };
  }
}