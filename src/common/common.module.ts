import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error.filter';

import { ValidationService } from './validation.service';
import { PrismaService } from './prisma.service';
import { AuthService } from './Auth/auth.service';
import { AuthMiddleware } from './Auth/auth.middleware';
@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.simple(), // ← format bawaan winston
        ),
        transports: [new winston.transports.Console()],
        }),
    ConfigModule.forRoot({
        isGlobal: true,
    })
    ],
    providers: [
        PrismaService, ValidationService, AuthService,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        }
    ],
    exports: [PrismaService, ValidationService, AuthService],
})
export class CommonModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // You can apply middleware here if needed
        consumer.apply(AuthMiddleware).forRoutes('*'); // Apply AuthMiddleware to all routes
    }
}
 