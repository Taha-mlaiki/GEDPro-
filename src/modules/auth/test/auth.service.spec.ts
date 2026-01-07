import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../users/users.service';
import bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  // Test fixtures
  const mockUser = {
    id: 1,
    full_name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    refreshTokenHash: 'hashedRefreshToken',
    role: { id: 1, name: 'admin', permessions: [] },
    organization: { id: 1, name: 'Test Org' },
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  beforeEach(async () => {
    // Create mocks
    const mockUserService = {
      registerUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user and return tokens', async () => {
      // Arrange
      userService.registerUser.mockResolvedValue(mockUser as any);
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(userService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.full_name).toBe(mockUser.full_name);
      expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
      expect(result.tokens.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should save hashed refresh token after registration', async () => {
      // Arrange
      userService.registerUser.mockResolvedValue(mockUser as any);
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      await authService.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(mockTokens.refreshToken, 10);
      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        refreshTokenHash: 'hashedRefreshToken',
      });
    });
  });

  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw BadRequestException on invalid password', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with correct payload', () => {
      // Arrange
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      // Act
      const result = authService.generateTokens(1, 'admin', 1);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 1, role: 'admin', organizationId: 1 },
        expect.objectContaining({ expiresIn: '15m' }),
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 1, role: 'admin', organizationId: 1 },
        expect.objectContaining({ expiresIn: '7d' }),
      );
      expect(result).toEqual(mockTokens);
    });
  });

  describe('validateGenerateTokens', () => {
    it('should throw UnauthorizedException if no refresh token hash exists', async () => {
      // Arrange
      const userWithoutRefresh = { ...mockUser, refreshTokenHash: null };
      userService.findById.mockResolvedValue(userWithoutRefresh as any);

      // Act & Assert
      await expect(
        authService.validateGenerateTokens(1, 'someRefreshToken'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.validateGenerateTokens(1, 'invalidRefreshToken'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should generate new tokens if refresh token is valid and near expiry', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // Token expires in less than 1 day
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      });
      jwtService.sign
        .mockReturnValueOnce('new.access.token')
        .mockReturnValueOnce('new.refresh.token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedRefresh');
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const result = await authService.validateGenerateTokens(
        1,
        'validRefreshToken',
      );

      // Assert
      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('new.refresh.token');
      expect(userService.updateUser).toHaveBeenCalled();
    });

    it('should return existing refresh token if not near expiry', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // Token expires in more than 5 days
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 6 * 24 * 60 * 60,
      });
      jwtService.sign.mockReturnValueOnce('new.access.token');

      // Act
      const result = await authService.validateGenerateTokens(
        1,
        'validRefreshToken',
      );

      // Assert
      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('validRefreshToken');
    });
  });

  describe('saveRefresh', () => {
    it('should hash and save refresh token', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedToken');
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      await authService.saveRefresh(1, 'refreshToken');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('refreshToken', 10);
      expect(userService.updateUser).toHaveBeenCalledWith(1, {
        refreshTokenHash: 'hashedToken',
      });
    });
  });
});
