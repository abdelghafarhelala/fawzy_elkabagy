import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: '../admin.css',
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly userEmail = () => this.auth.user()?.email ?? '';

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
