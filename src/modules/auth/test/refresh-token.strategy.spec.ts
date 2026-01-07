import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenStrategy } from '../strategies/refreshToken.strategy';
import { AuthService } from '../auth.service';
import { Request } from 'express';

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'new.access.token',
    refreshToken: 'new.refresh.token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateGenerateTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate refresh token and return new tokens', async () => {
      // Arrange
      const mockRequest = {
        cookies: { refreshToken: 'valid.refresh.token' },
      } as Request & { cookies: { refreshToken: string } };
      const payload = { sub: 1 };
      authService.validateGenerateTokens.mockResolvedValue(mockTokens);

      // Act
      const result = await strategy.validate(mockRequest, payload);

      // Assert
      expect(authService.validateGenerateTokens).toHaveBeenCalledWith(
        1,
        'valid.refresh.token',
      );
      expect(result).toEqual(mockTokens);
    });

    it('should pass refresh token from cookies to auth service', async () => {
      // Arrange
      const refreshToken = 'specific.refresh.token';
      const mockRequest = {
        cookies: { refreshToken },
      } as Request & { cookies: { refreshToken: string } };
      const payload = { sub: 42 };
      authService.validateGenerateTokens.mockResolvedValue(mockTokens);

      // Act
      await strategy.validate(mockRequest, payload);

      // Assert
      expect(authService.validateGenerateTokens).toHaveBeenCalledWith(
        42,
        refreshToken,
      );
    });
  });
});
