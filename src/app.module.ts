import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/users.module';
import { TypeOrmDatabaseModule } from './database/typeorm.module';
import { MongooseDatabaseModule } from './database/mongoose.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { OrganizationModule } from './modules/organization/organization.module';
import { StorageModule } from './providers/storage/storage.module';
import { CandidateModule } from './modules/candidates/candidate.module';
import { FormsModule } from './modules/forms/forms.module';
import { TenancyInterceptor } from './common/interceptors/tenancy.interceptor';
import { TenantContextService } from './common/services/tenant-context.service';

@Module({
  imports: [
    MongooseDatabaseModule,
    TypeOrmDatabaseModule,
    UserModule,
    AuthModule,
    OrganizationModule,
    StorageModule,
    CandidateModule,
    FormsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantContextService,
    // Global TenancyInterceptor - applies to all routes
    // Note: For routes that don't need tenant context (auth), the interceptor skips if no user
    {
      provide: APP_INTERCEPTOR,
      useClass: TenancyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
  }
}
