/**
 * ========================================
 * SWAGGER DTOs (Data Transfer Objects)
 * ========================================
 *
 * WHY SEPARATE DTO FILES FOR SWAGGER?
 * Since you use Zod for validation, Swagger can't automatically
 * infer the schema. We create class-based DTOs with decorators
 * that Swagger can read to generate documentation.
 *
 * ALTERNATIVE: Use @nestjs/swagger's zodToOpenApi() transformer
 * But explicit classes give more control over documentation.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ========================================
 * @ApiProperty() DECORATOR
 * ========================================
 *
 * Describes a property in the Swagger UI:
 * - example: Shows sample value (very helpful!)
 * - description: Explains what the field is for
 * - required: defaults to true (use @ApiPropertyOptional for optional)
 * - type: Usually inferred, but can be explicit
 * - enum: For fields with fixed values
 * - minimum/maximum: For number constraints
 */

/**
 * Login Request DTO
 * Used for: POST /auth/login
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    example: 'mySecurePassword123',
    description: 'User password (min 5 characters)',
    minLength: 5,
  })
  password: string;
}

/**
 * Register Request DTO
 * Used for: POST /auth/register
 */
export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name (min 4 characters)',
    minLength: 4,
  })
  full_name: string;

  @ApiProperty({
    example: 'newuser@example.com',
    description: 'User email address',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'User password (min 5 characters)',
    minLength: 5,
  })
  password: string;
}

/**
 * ========================================
 * RESPONSE DTOs
 * ========================================
 *
 * These describe what the API returns.
 * Without these, Swagger would just show "object" as the response.
 */

/**
 * User info returned in auth responses
 */
export class AuthUserDto {
  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'admin', description: 'User role name' })
  role: string;
}

/**
 * Successful login/register response
 */
export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (15 min expiry)',
  })
  accessToken: string;

  @ApiProperty({
    type: AuthUserDto,
    description: 'User information',
  })
  user: AuthUserDto;
}

/**
 * Token refresh response
 */
export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token',
  })
  accessToken: string;
}

/**
 * ========================================
 * ERROR RESPONSE DTOs
 * ========================================
 *
 * Documenting errors helps frontend developers handle them properly.
 */
export class UnauthorizedResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;
}

export class BadRequestResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Invalid credentials' })
  message: string;

  @ApiPropertyOptional({ example: 'Bad Request' })
  error?: string;
}
