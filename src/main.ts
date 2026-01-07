import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config/config';
import cookieParser from 'cookie-parser';

/**
 * ========================================
 * SWAGGER (OpenAPI) SETUP
 * ========================================
 *
 * WHAT IS SWAGGER?
 * Swagger (now OpenAPI) is a specification for describing REST APIs.
 * It generates interactive documentation that lets developers:
 * - See all available endpoints
 * - Understand request/response formats
 * - Test API calls directly from the browser
 *
 * WHY USE IT?
 * - Auto-generated docs stay in sync with code
 * - Frontend teams can see API contracts immediately
 * - Easy testing without Postman/curl
 * - Industry standard (OpenAPI 3.0)
 */
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix('api');

  /**
   * SWAGGER CONFIGURATION
   *
   * DocumentBuilder: Creates the OpenAPI specification document
   * - setTitle: API name shown in the UI header
   * - setDescription: Explains what the API does
   * - setVersion: API version (useful for versioning)
   * - addBearerAuth: Adds JWT authentication support
   * - addTag: Groups related endpoints together
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GEDPro API')
    .setDescription(
      `
## Intelligent HR Document Management Platform

### Authentication
All protected endpoints require a JWT Bearer token in the Authorization header.

### Multi-Tenancy
Each user belongs to an organization. Data is isolated per-tenant.

### Available Modules
- **Auth**: Login, Register, Token Refresh
- **Users**: User management
- **Candidates**: Candidate lifecycle management
- **Organizations**: Tenant management
    `,
    )
    .setVersion('1.0')
    /**
     * addBearerAuth(): Adds a "lock" icon to protected endpoints
     * - type: 'http' = HTTP authentication scheme
     * - scheme: 'bearer' = Bearer token format
     * - bearerFormat: 'JWT' = JSON Web Token
     * - name/description: Labels in the UI
     * - in: 'header' = Token goes in Authorization header
     */
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'access-token', // This is the security name referenced in @ApiBearerAuth()
    )
    /**
     * addCookieAuth(): Adds cookie-based authentication for refresh tokens
     * This is used for the /auth/refresh endpoint
     */
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
    })
    /**
     * addTag(): Groups endpoints in the UI
     * First parameter is the tag name (used in @ApiTags())
     * Second parameter is the description
     */
    .addTag('Auth', 'Authentication endpoints (login, register, refresh)')
    .addTag('Users', 'User management')
    .addTag('Candidates', 'Candidate lifecycle management')
    .addTag('Organizations', 'Tenant management')
    .build();

  /**
   * SwaggerModule.createDocument(): Generates the OpenAPI spec
   * - Scans all controllers for @Api* decorators
   * - Builds the JSON specification from your code
   */
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  /**
   * SwaggerModule.setup(): Mounts the Swagger UI
   * - First param: URL path (e.g., /api/docs)
   * - Second param: NestJS app instance
   * - Third param: The OpenAPI document
   * - Fourth param: Options (customize UI appearance)
   */
  SwaggerModule.setup('api/docs', app, document, {
    /**
     * swaggerOptions: Customize the Swagger UI behavior
     */
    swaggerOptions: {
      persistAuthorization: true, // Keep token after page refresh
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
    /**
     * customSiteTitle: Browser tab title
     */
    customSiteTitle: 'GEDPro API Documentation',
  });

  await app.listen(config.PORT);

  // Log the Swagger URL for convenience
  console.log(`🚀 Application running on: http://localhost:${config.PORT}/api`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${config.PORT}/api/docs`,
  );
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
  process.exit(1);
});
