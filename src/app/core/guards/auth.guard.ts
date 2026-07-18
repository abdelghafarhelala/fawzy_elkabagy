import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait briefly for session restore
  const started = Date.now();
  while (!auth.ready() && Date.now() - started < 3000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
