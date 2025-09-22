import type { DatabaseService } from "../../config/database.service";
import type { Observable } from "rxjs";

import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import { tap } from "rxjs/operators";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly _databaseService: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Set tenant context if user is authenticated
    if (user && user.tenant_id) {
      return next.handle().pipe(
        tap(async () => {
          await this._databaseService.setTenantContext(user.tenant_id);
        }),
      );
    }

    return next.handle();
  }
}
