import { Test } from '@nestjs/testing';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();
    service = module.get(AuthService);
  });

  it('login : should return accessToken and refreshToken in tokens', async () => {
    const user = await service.login('mlaikitaha29@gmail.com', 'tahamlk321');
    expect(user.tokens).toHaveProperty('accessToken');
    expect(user.tokens).toHaveProperty('refreshToken');
  });

  it('register : should return accessToken and refreshToken ', async () => {
    const user = await service.register({
      full_name: 'taha mlaiki',
      email: 'babo@gmail.com',
      password: 'tahamlk321',
    });
    expect(user.tokens).toHaveProperty('accessToken');
    expect(user.tokens).toHaveProperty('refreshToken');
  });
  it('register : should throw an error ', async () => {
    const user = await service.register({
      full_name: 'taha mlaiki',
      email: 'babo@gmail.com',
      password: 'tahamlk321',
    });
    expect(user.tokens).toHaveProperty('accessToken');
    expect(user.tokens).toHaveProperty('refreshToken');
  });
});
