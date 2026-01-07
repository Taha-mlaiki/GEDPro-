import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Mock response object
  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  // Test fixtures
  const mockAuthResult = {
    user: {
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
    tokens: {
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateGenerateTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const registerDto = {
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register user and set refresh token cookie', async () => {
      // Arrange
      const res = mockResponse();
      authService.register.mockResolvedValue(mockAuthResult);

      // Act
      await controller.register(registerDto, res);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResult.tokens.refreshToken,
        { httpOnly: true, sameSite: 'strict' },
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: mockAuthResult.tokens.accessToken,
        user: mockAuthResult.user,
      });
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and set refresh token cookie', async () => {
      // Arrange
      const res = mockResponse();
      authService.login.mockResolvedValue(mockAuthResult);

      // Act
      await controller.login(loginDto, res);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResult.tokens.refreshToken,
        { httpOnly: true, sameSite: 'strict' },
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: mockAuthResult.tokens.accessToken,
        user: mockAuthResult.user,
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens and set new cookie', () => {
      // Arrange
      const res = mockResponse();
      const tokenData = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      };

      // Act
      controller.refreshTokens(tokenData, res);

      // Assert
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokenData.refreshToken,
        { httpOnly: true, sameSite: 'strict' },
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: tokenData.accessToken,
      });
    });
  });
});
