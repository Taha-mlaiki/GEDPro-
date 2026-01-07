import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  TenantContextService,
  TenantContextData,
} from '../services/tenant-context.service';

/**
 * TenancyInterceptor
 *
 * Extracts tenant information from JWT and establishes tenant context for the request.
 * This interceptor MUST be applied AFTER JWT authentication guard.
 *
 * HOW IT WORKS:
 * 1. Extracts organizationId from JWT-validated user
 * 2. Wraps entire request handling in AsyncLocalStorage context
 * 3. All downstream services can access TenantContextService.getOrganizationId()
 *
 * SECURITY: This ensures tenant isolation at the application level.
 * Combined with repository-level WHERE clauses, this provides defense-in-depth.
 */
@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: {
      user: { id: number; organizationId: number; role: string };
    } = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip tenant context for unauthenticated routes
    if (!user) {
      return next.handle();
    }

    // Validate organizationId exists
    if (!user.organizationId && user.organizationId !== 0) {
      throw new UnauthorizedException(
        'User is not associated with any organization',
      );
    }

    const tenantData: TenantContextData = {
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
    };

    // Wrap the request handling in tenant context
    return new Observable((subscriber) => {
      this.tenantContext.run(tenantData, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
