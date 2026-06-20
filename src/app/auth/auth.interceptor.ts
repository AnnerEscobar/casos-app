import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service/auth.service';

let handlingExpiredSession = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error) => {
      const isLoginRequest = req.url.includes('/auth/login');
      const isSessionCheck = req.url.includes('/auth/session');
      const isLogoutRequest = req.url.includes('/auth/logout');
      const shouldHandleExpiredSession =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isLoginRequest &&
        !isSessionCheck &&
        !isLogoutRequest;

      if (shouldHandleExpiredSession) {
        authService.expireSession();

        if (!handlingExpiredSession) {
          handlingExpiredSession = true;
          const returnUrl = router.url && router.url !== '/login' ? router.url : '/casos';

          router.navigate(['/login'], {
            queryParams: { returnUrl, sessionExpired: '1' }
          }).finally(() => {
            setTimeout(() => handlingExpiredSession = false, 1000);
          });
        }
      }

      return throwError(() => error);
    })
  );
};
