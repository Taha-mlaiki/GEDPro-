import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserService } from '../src/modules/users/users.service';
import { AccessTokenStrategy } from '../src/modules/auth/strategies/acccessToken.strategy';
import { RefreshTokenStrategy } from '../src/modules/auth/strategies/refreshToken.strategy';
import bcrypt from 'bcrypt';

/**
 * E2E Tests for Auth Module
 *
 * These tests make real HTTP requests to the auth endpoints.
 * All database operations are mocked.
 *
 * Run with: npm run test:e2e
 */
describe('Auth Module (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let userService: jest.Mocked<UserService>;

  const testPassword = 'testpassword123';
  let hashedPassword: string;

  const mockUser = {
    id: 1,
    full_name: 'E2E Test User',
    email: 'e2e@test.com',
    password: '', // Set in beforeAll
    refreshTokenHash: null,
    role: { id: 1, name: 'admin', permessions: [] },
    organization: { id: 1, name: 'Test Org' },
  };

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(testPassword, 10);
    mockUser.password = hashedPassword;
  });

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      registerUser: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-access-secret',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get(UserService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return access token with cookie', async () => {
      // Arrange
      const registerDto = {
        full_name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
      };
      userService.registerUser.mockResolvedValue({
        ...mockUser,
        ...registerDto,
      } as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Assert
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should return 400 for invalid registration data', async () => {
      // Arrange - Missing required fields
      const invalidDto = { email: 'invalid' };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: testPassword })
        .expect(201);

      // Assert
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for invalid credentials', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'wrongpassword' })
        .expect(400);
    });

    it('should return 400 for non-existent user', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password' })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens when valid refresh token cookie is provided', async () => {
      // Arrange - Login first to get a valid refresh token
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: testPassword });

      const cookies = loginResponse.headers['set-cookie'];

      // Setup for refresh - user now has refresh token hash
      const refreshToken = cookies[0].split(';')[0].split('=')[1];
      userService.findById.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
      } as any);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(201);

      // Assert
      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 401 without refresh token cookie', async () => {
      // Act & Assert
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });
  });

  describe('Token Payload Verification', () => {
    it('should include organizationId in access token for multi-tenancy', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: testPassword })
        .expect(201);

      // Assert - Decode token and verify payload
      const decoded = jwtService.decode(response.body.accessToken);

      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.role).toBe(mockUser.role.name);
      expect(decoded.organizationId).toBe(mockUser.organization.id);
    });
  });
});
