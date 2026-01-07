import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * TenantContext Service
 *
 * Uses AsyncLocalStorage to maintain request-scoped tenant context without:
 * - Passing organizationId through every function call
 * - Performance overhead of NestJS REQUEST scope
 * - Manual threading of context through repositories
 *
 * WHY AsyncLocalStorage?
 * - Zero performance overhead compared to request-scoped providers
 * - Automatically propagates through async call chains
 * - No changes needed to existing service method signatures
 *
 * ALTERNATIVE: NestJS @Inject(REQUEST) with Scope.REQUEST
 * - Downside: Creates new instances of all dependent providers per request
 * - Downside: Cannot be used with singleton providers
 */

export interface TenantContextData {
  organizationId: number;
  userId: number;
  role: string;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextData>();

  /**
   * Run a callback within a tenant context
   * All async operations within will have access to this context
   */
  run<T>(context: TenantContextData, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Get the current tenant context
   * Returns undefined if called outside of a tenant context
   */
  getContext(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  /**
   * Get the current organization ID
   * Throws if called outside of a tenant context
   */
  getOrganizationId(): number {
    const context = this.getContext();
    if (!context) {
      throw new Error(
        'No tenant context available. Ensure TenancyInterceptor is applied.',
      );
    }
    return context.organizationId;
  }

  /**
   * Get the current user ID
   */
  getUserId(): number {
    const context = this.getContext();
    if (!context) {
      throw new Error('No tenant context available.');
    }
    return context.userId;
  }

  /**
   * Check if a tenant context is active
   */
  hasContext(): boolean {
    return this.storage.getStore() !== undefined;
  }
}
