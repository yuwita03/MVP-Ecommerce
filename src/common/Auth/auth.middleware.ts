// ===== auth.middleware.ts =====
import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,       // untuk query user ke DB
    private authService: AuthService,    // untuk verifikasi token JWT
  ) {}

  async use(req: any, res: any, next: () => void) {
    // Ambil token dari header Authorization
    const token = req.headers['authorization'] as string;

    if (token) {
      try {
        // Verifikasi token via AuthService
        // Jika invalid/expired → AuthService throw error → loncat ke catch
        const payload = this.authService.verifyToken(token);

        // Cari user di DB berdasarkan id dari payload JWT
        // Pakai findUnique karena id pasti unik, lebih efisien dari findFirst
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });

        // Kalau user ditemukan, attach ke request
        // Nanti bisa diakses di controller via decorator @Auth()
        if (user) req.user = user;
      } catch {
        // Token invalid/expired → tidak throw error, cukup skip
        // Request tetap lanjut tapi req.user = undefined
        // Decorator @Auth() yang akan throw Unauthorized kalau endpoint butuh login
      }
    }

    // Lanjut ke handler berikutnya (controller)
    next();
  }
}