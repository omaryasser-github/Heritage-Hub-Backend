import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { JwtPayload } from '../../shared/interfaces/authenticated-user.interface';
import { ACCESS_TOKEN_EXPIRES, BCRYPT_ROUNDS, REFRESH_TOKEN_TTL_DAYS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    return this.issueTokenPair(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const sessionId = this.parseRefreshToken(refreshToken);
    if (!sessionId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    if (session.revokedAt) {
      await this.revokeFamily(session.familyId);
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Refresh token reuse detected',
      });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Refresh token expired',
      });
    }

    const tokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!tokenValid) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(session.user, session.familyId);
  }

  async logout(refreshToken: string): Promise<void> {
    const sessionId = this.parseRefreshToken(refreshToken);
    if (!sessionId) {
      return;
    }

    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.revokedAt) {
      return;
    }

    const tokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!tokenValid) {
      return;
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(user: User, familyId?: string): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const refreshToken = this.buildRefreshToken(sessionId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        familyId: familyId ?? randomUUID(),
        expiresAt,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    return { accessToken, refreshToken };
  }

  private buildRefreshToken(sessionId: string): string {
    const secret = randomBytes(32).toString('hex');
    return `${sessionId}.${secret}`;
  }

  parseRefreshToken(refreshToken: string): string | null {
    const dotIndex = refreshToken.indexOf('.');
    if (dotIndex <= 0) {
      return null;
    }

    return refreshToken.slice(0, dotIndex);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { familyId } });
  }
}
