import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: '../admin.css',
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly i18n = inject(TranslationService);

  email = '';
  password = '';
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly nextLanguageLabel = computed(() =>
    this.languageService.currentLanguage() === 'ar' ? 'EN' : 'AR',
  );

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

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
          : this.i18n.t('admin.login.failed');
      this.errorMessage.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
