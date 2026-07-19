import { Component, computed, inject, signal } from '@angular/core';
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

  readonly userMenuOpen = signal(false);
  readonly userEmail = () => this.auth.user()?.email ?? '';
  readonly userInitial = computed(() => {
    const email = this.auth.user()?.email ?? '';
    return email ? email.charAt(0).toUpperCase() : 'A';
  });
  readonly currentLanguage = this.languageService.currentLanguage;
  readonly nextLanguageLabel = computed(() =>
    this.currentLanguage() === 'ar' ? 'EN' : 'AR',
  );

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeUserMenu();
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
