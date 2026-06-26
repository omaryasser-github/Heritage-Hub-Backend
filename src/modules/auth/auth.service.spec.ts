import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    session: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };

  const mockUser: User = {
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashed',
    displayName: null,
    avatarUrl: null,
    language: 'en',
    role: UserRole.user,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token-jwt'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('register stores hashed password, not plaintext', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.session.create.mockResolvedValue({});

    await service.register({ email: 'test@example.com', password: 'Password123!' });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', expect.any(Number));
  });

  it('register throws when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.register({ email: 'test@example.com', password: 'Password123!' }),
    ).rejects.toThrow(ConflictException);
  });

  it('login throws on invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh revokes session on reuse and deletes family', async () => {
    const sessionId = 'session-uuid';
    const refreshToken = `${sessionId}.secretpart`;
    const revokedSession = {
      id: sessionId,
      userId: mockUser.id,
      refreshTokenHash: 'hash',
      familyId: 'family-uuid',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      createdAt: new Date(),
      user: mockUser,
    };

    prisma.session.findUnique.mockResolvedValue(revokedSession);
    prisma.session.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { familyId: 'family-uuid' },
    });
  });

  it('logoutAll revokes active sessions for user', async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 2 });

    await service.logoutAll(mockUser.id);

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) as Date },
    });
  });
});
