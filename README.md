# E-Commerce Platform (NestJS + React)

A full-stack e-commerce application with payment gateway integration using Midtrans Snap.

## Features

- User authentication (JWT)
- Product catalog
- Shopping cart system
- Checkout flow
- Midtrans payment integration
- Webhook payment status update
- Order management system

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: NestJS, Prisma
- Database: MySQL
- Payment: Midtrans Snap

## Payment Flow

1. User creates order from cart
2. Backend generates unique transaction ID
3. Midtrans Snap returns payment URL
4. User completes payment
5. Webhook updates order status automatically

## Architecture

- Modular NestJS services (OrderService, PaymentService)
- Prisma ORM for database management
- REST API structure

## Key Feature

- Unique Midtrans order_id per transaction
- Prevent duplicate payment requests
- Secure webhook validation