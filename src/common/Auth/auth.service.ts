// ===== auth.service.ts =====
import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  // Ambil JWT_SECRET dari .env, tanda ! karena kita jamin pasti ada
  private readonly secret = process.env.JWT_SECRET!;

  constructor(private prisma: PrismaService) {}

  // Generate token JWT baru, payload berisi id user (sub = subject)
  // Token berlaku 7 hari, setelah itu expired dan harus login ulang
  generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.secret, { expiresIn: '7d' });
  }

  // Verifikasi token JWT yang dikirim client
  // Kalau valid → return payload { sub: userId }
  // Kalau invalid/expired → throw 401 Unauthorized
  verifyToken(token: string): { sub: string } {
    try {
      return jwt.verify(token, this.secret) as { sub: string };
    } catch {
      throw new HttpException('Unauthorized', 401);
    }
  }
}