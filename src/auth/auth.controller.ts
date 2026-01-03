import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { type Response } from 'express';
import { type loginDTO, loginSchema } from './dtos/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type registerUserDTO,
  registerUserSchema,
} from '../users/dtos/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe<registerUserDTO>(registerUserSchema))
    dto: registerUserDTO,
    @Res() res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
    });
    res
      .status(201)
      .json({ accessToken: result.tokens.accessToken, user: result.user });
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe<loginDTO>(loginSchema)) dto: loginDTO,
    @Res() res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
    });
    res
      .status(201)
      .json({ accessToken: result.tokens.accessToken, user: result.user });
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refreshTokens(
    @CurrentUser() data: { accessToken: string; refreshToken: string },
    @Res() res: Response,
  ) {
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
    });
    res.status(201).json({ accessToken: data.accessToken });
  }
}
