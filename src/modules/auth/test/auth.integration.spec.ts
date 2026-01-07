import { Test, TestingModule } from '@nestjs/testing';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UserService } from '../../users/users.service';
import { AccessTokenStrategy } from '../strategies/acccessToken.strategy';
import bcrypt from 'bcrypt';

/**
 * Integration Tests for Auth Module
 *
 * These tests verify that multiple components work together:
 * - AuthService generates valid tokens
 * - AccessTokenStrategy can validate those tokens
 * - Token payload contains correct tenant information
 *
 * Dependencies: Only UserService is mocked (database layer)
 */
describe('Auth Module Integration', () => {
  let authService: AuthService;
  let accessTokenStrategy: AccessTokenStrategy;
  let jwtService: JwtService;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 1,
    full_name: 'Integration Test User',
    email: 'integration@test.com',
    password: '', // Will be set in beforeEach
    refreshTokenHash: null,
    role: {
      id: 1,
      name: 'admin',
      permessions: [{ name: 'read' }, { name: 'write' }],
    },
    organization: { id: 42, name: 'Test Org' },
  };

  beforeEach(async () => {
    // Hash a real password for testing
    mockUser.password = await bcrypt.hash('testpassword123', 10);

    const mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      registerUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        AccessTokenStrategy,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    accessTokenStrategy = module.get<AccessTokenStrategy>(AccessTokenStrategy);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get(UserService);

    jest.clearAllMocks();
  });

  describe('Login → Token Generation → Token Validation Flow', () => {
    it('should generate tokens that contain correct multi-tenant payload', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      // Act
      const loginResult = await authService.login(
        'integration@test.com',
        'testpassword123',
      );

      // Assert - Decode and verify token payload
      const decoded = jwtService.decode(loginResult.tokens.accessToken);

      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.role).toBe(mockUser.role.name);
      expect(decoded.organizationId).toBe(mockUser.organization.id);
    });

    it('should validate token and return user with permissions', async () => {
      // Arrange - Generate token
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.findById.mockResolvedValue(mockUser as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      const loginResult = await authService.login(
        'integration@test.com',
        'testpassword123',
      );

      // Decode to get payload (simulating what Passport does)
      const payload = jwtService.decode(loginResult.tokens.accessToken);

      // Act - Validate token (this is what happens on protected routes)
      const validatedUser = await accessTokenStrategy.validate(payload);

      // Assert
      expect(validatedUser.id).toBe(mockUser.id);
      expect(validatedUser.role).toBe('admin');
      expect(validatedUser.organizationId).toBe(42);
      expect(validatedUser.permessions).toContain('read');
      expect(validatedUser.permessions).toContain('write');
    });
  });

  describe('Token Refresh Flow', () => {
    it('should generate new access token using refresh token', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser as any);
      userService.findById.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: await bcrypt.hash('mock.refresh.token', 10),
      } as any);
      userService.updateUser.mockResolvedValue(mockUser as any);

      const loginResult = await authService.login(
        'integration@test.com',
        'testpassword123',
      );

      // Update mock to return user with saved refresh token
      userService.findById.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: await bcrypt.hash(
          loginResult.tokens.refreshToken,
          10,
        ),
      } as any);

      // Act - Validate and potentially regenerate tokens
      const newTokens = await authService.validateGenerateTokens(
        mockUser.id,
        loginResult.tokens.refreshToken,
      );

      // Assert
      expect(newTokens.accessToken).toBeDefined();
      expect(typeof newTokens.accessToken).toBe('string');
    });
  });

  describe('Multi-tenant Token Isolation', () => {
    it('should include organizationId in token for tenant isolation', () => {
      // Arrange
      const org1User = { ...mockUser, organization: { id: 100, name: 'Org1' } };
      const org2User = {
        ...mockUser,
        id: 2,
        organization: { id: 200, name: 'Org2' },
      };

      // Act - Generate tokens for different tenants
      const tokens1 = authService.generateTokens(
        org1User.id,
        org1User.role.name,
        org1User.organization.id,
      );
      const tokens2 = authService.generateTokens(
        org2User.id,
        org2User.role.name,
        org2User.organization.id,
      );

      // Assert - Tokens should contain different organizationIds
      const decoded1 = jwtService.decode(tokens1.accessToken);
      const decoded2 = jwtService.decode(tokens2.accessToken);

      expect(decoded1.organizationId).toBe(100);
      expect(decoded2.organizationId).toBe(200);
      expect(decoded1.organizationId).not.toBe(decoded2.organizationId);
    });
  });
});
