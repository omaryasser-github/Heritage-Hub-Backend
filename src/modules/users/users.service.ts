import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export type UserProfile = Pick<
  User,
  'id' | 'email' | 'displayName' | 'avatarUrl' | 'language' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
      },
    });

    return this.toProfile(user);
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      language: user.language,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
