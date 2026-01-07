import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { type Response } from 'express';
import { type loginDTO, loginSchema } from './dtos/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  type registerUserDTO,
  registerUserSchema,
} from '../users/dtos/user.dto';

/**
 * ========================================
 * SWAGGER DECORATORS IMPORT
 * ========================================
 *
 * These decorators tell Swagger how to document your API:
 * - @ApiTags: Groups endpoints under a section
 * - @ApiOperation: Describes what an endpoint does
 * - @ApiBody: Describes the request body structure
 * - @ApiResponse: Describes possible responses
 * - @ApiBearerAuth: Indicates JWT authentication required
 * - @ApiCookieAuth: Indicates cookie auth required
 */
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

/**
 * Import our Swagger DTOs (for documentation only)
 */
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  RefreshResponseDto,
  BadRequestResponseDto,
  UnauthorizedResponseDto,
} from './dtos/auth-swagger.dto';

/**
 * ========================================
 * @ApiTags('Auth')
 * ========================================
 *
 * Groups all endpoints in this controller under the "Auth" section
 * in the Swagger UI. This matches the tag we defined in main.ts.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * ========================================
   * REGISTER ENDPOINT
   * ========================================
   */
  @Post('register')
  /**
   * @ApiOperation: Describes what this endpoint does
   * - summary: Short one-line description (shown in endpoint list)
   * - description: Detailed explanation (shown when expanded)
   */
  @ApiOperation({
    summary: 'Register a new user',
    description: `
Creates a new user account and returns authentication tokens.

**Flow:**
1. Validates email is unique
2. Hashes password with bcrypt
3. Creates user with default role
4. Generates JWT access + refresh tokens
5. Sets refresh token in HTTP-only cookie

**Note:** New users are created without an organization.
Admin must assign them to an organization.
    `,
  })
  /**
   * @ApiBody: Describes the request body
   * - type: Reference to the DTO class with @ApiProperty decorators
   * - description: Additional context
   */
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
  })
  /**
   * @ApiResponse: Documents possible HTTP responses
   * - status: HTTP status code
   * - description: When this response occurs
   * - type: Response body structure
   *
   * BEST PRACTICE: Document both success AND error responses
   */
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
    type: BadRequestResponseDto,
  })
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

  /**
   * ========================================
   * LOGIN ENDPOINT
   * ========================================
   */
  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: `
Authenticates user and returns JWT tokens.

**Token Expiry:**
- Access token: 15 minutes
- Refresh token: 7 days (stored in HTTP-only cookie)

**Security:**
- Password compared using bcrypt
- Refresh token hashed before storage
    `,
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials',
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or password',
    type: BadRequestResponseDto,
  })
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

  /**
   * ========================================
   * REFRESH TOKEN ENDPOINT
   * ========================================
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: `
Uses the refresh token (from cookie) to generate a new access token.

**How it works:**
1. Reads refresh token from HTTP-only cookie
2. Validates token hasn't been revoked
3. If token expires in < 1 day, generates new refresh token too
4. Returns new access token

**Note:** This endpoint requires the \`refreshToken\` cookie to be present.
    `,
  })
  /**
   * @ApiCookieAuth: Indicates this endpoint uses cookie authentication
   * The name 'refreshToken' matches what we configured in main.ts
   */
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 201,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: UnauthorizedResponseDto,
  })
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
