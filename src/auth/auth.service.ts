import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { registerUserDTO } from '../users/dtos/user.dto';
import { config } from '../config/config';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwt: JwtService,
  ) {}

  async register(dto: registerUserDTO) {
    const user = await this.userService.registerUser(dto);
    const tokens = this.generateTokens(user.id, user.role.name);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return {
      user: {
        full_name: user.full_name,
        email: user.email,
        role: user.role.name,
      },
      tokens,
    };
  }
  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const tokens = this.generateTokens(user.id, user.role.name);
      await this.saveRefresh(user.id, tokens.refreshToken);
      return {
        user: {
          full_name: user.full_name,
          email: user.email,
          role: user.role.name,
        },
        tokens,
      };
    }
    throw new BadRequestException('Invalid credentials');
  }

  async saveRefresh(userId: number, refreshToken: string) {
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateUser(userId, {
      refreshTokenHash: hashedRefresh,
    });
  }

  async validateGenerateTokens(user_id: number, refreshToken: string) {
    const user = await this.userService.findById(user_id);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('You need to login');
    }
    const isTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isTokenValid) throw new UnauthorizedException('You need to login');
    const decoded: { exp: number } = this.jwt.decode(refreshToken);
    if (decoded && decoded.exp) {
      const expiresInMs = decoded.exp * 1000 - Date.now();
      const fiveDaysMs = 1 * 24 * 60 * 60 * 1000;
      if (expiresInMs <= fiveDaysMs) {
        const tokens = this.generateTokens(user.id, user.role.name);
        await this.saveRefresh(user.id, tokens.refreshToken);
        return tokens;
      }
    }
    const tokens = this.generateTokens(user.id, user.role.name);
    return {
      refreshToken,
      accessToken: tokens.accessToken,
    };
  }

  generateTokens(id: number, role: string) {
    const payload = {
      sub: id,
      role,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: config.JWT_ACCESS_SECRET as string,
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: config.JWT_REFRESH_TOKEN,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
