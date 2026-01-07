import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenStrategy } from '../strategies/acccessToken.strategy';
import { UserService } from '../../users/users.service';

jest.mock('../../../config/config', () => ({
  config: {
    JWT_ACCESS_SECRET: 'test-secret-key',
  },
}));

describe('AccessTokenStrategy', () => {
  let strategy: AccessTokenStrategy;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 1,
    full_name: 'Test User',
    email: 'test@example.com',
    role: {
      id: 1,
      name: 'admin',
      permessions: [{ name: 'read' }, { name: 'write' }],
    },
    organization: { id: 1, name: 'Test Org' },
  };

  beforeEach(async () => {
    const mockUserService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenStrategy,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    strategy = module.get<AccessTokenStrategy>(AccessTokenStrategy);
    userService = module.get(UserService);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data with permissions from valid token payload', async () => {
      // Arrange
      const payload = {
        sub: 1,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 1,
      };
      userService.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: mockUser.id,
        full_name: mockUser.full_name,
        email: mockUser.email,
        role: mockUser.role.name,
        organizationId: mockUser.organization.id,
        permessions: ['read', 'write'],
      });
    });

    it('should use payload organizationId if user has no organization', async () => {
      // Arrange
      const userWithoutOrg = { ...mockUser, organization: null };
      const payload = {
        sub: 1,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 99,
      };
      userService.findById.mockResolvedValue(userWithoutOrg as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.organizationId).toBe(99);
    });
  });
});
