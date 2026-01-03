import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { config } from '../../config/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private authService: AuthService) {
    super({
      //@eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req?.cookies?.refreshToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: config.JWT_REFRESH_TOKEN as string,
      passReqToCallback: true,
    });
  }

  //   validate(
  //     req: Request & { body?: { refreshToken: string } },
  //     payload: { sub: number },
  //   ) {
  //     // Safely access refreshToken from req.body
  //     const refreshToken =
  //       req.body && typeof req.body === 'object' && 'refreshToken' in req.body
  //         ? (req.body as { refreshToken: string }).refreshToken
  //         : undefined;
  //     return {
  //       id: payload.sub,

  //       refreshToken,
  //     };
  //   }

  async validate(
    req: Request & { cookies: { refreshToken: string } },
    payload: { sub: number },
  ) {
    const refreshToken: string = req.cookies?.refreshToken;
    const tokens = await this.authService.validateGenerateTokens(
      payload.sub,
      refreshToken,
    );

    return tokens;
  }
}
