import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../admin.css',
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    try {
      await this.auth.signIn(this.email.trim(), this.password);
      await this.router.navigateByUrl('/admin/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Login failed. Check your email and password.';
      this.errorMessage.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
