import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './shell.html',
  styleUrl: '../admin.css',
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  readonly userEmail = () => this.auth.user()?.email ?? '';
  readonly currentLanguage = this.languageService.currentLanguage;
  readonly nextLanguageLabel = computed(() =>
    this.currentLanguage() === 'ar' ? 'EN' : 'AR',
  );

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
