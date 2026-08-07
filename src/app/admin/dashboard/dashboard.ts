import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

type PublishPhase =
  | 'idle'
  | 'starting'
  | 'polling'
  | 'success'
  | 'error';

interface PublishRun {
  id: number | null;
  status: string | null;
  conclusion: string | null;
  html_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: '../admin.css',
})
export class AdminDashboard implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslationService);

  readonly isPublishing = signal(false);
  readonly phase = signal<PublishPhase>('idle');
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly lastRun = signal<PublishRun | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private startedAtMs = 0;

  ngOnDestroy(): void {
    this.stopPolling();
  }

  async publish(): Promise<void> {
    if (this.isPublishing()) {
      return;
    }

    const token = this.auth.session()?.access_token;
    if (!token) {
      this.phase.set('error');
      this.errorMessage.set(
        this.i18n.t('admin.dashboard.publishUnauthorized'),
      );
      this.statusMessage.set(null);
      return;
    }

    this.isPublishing.set(true);
    this.phase.set('starting');
    this.errorMessage.set(null);
    this.statusMessage.set(this.i18n.t('admin.dashboard.publishWorking'));

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (response.status === 401) {
        throw new Error(
          this.i18n.t('admin.dashboard.publishUnauthorized'),
        );
      }

      if (!response.ok || body.ok === false) {
        throw new Error(
          body.error || this.i18n.t('admin.dashboard.publishFailed'),
        );
      }

      this.phase.set('polling');
      this.statusMessage.set(
        body.message || this.i18n.t('admin.dashboard.publishStarted'),
      );
      this.startedAtMs = Date.now();
      this.startPolling(token);
    } catch (error) {
      this.phase.set('error');
      this.isPublishing.set(false);
      this.statusMessage.set(null);
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : this.i18n.t('admin.dashboard.publishFailed'),
      );
    }
  }

  private startPolling(token: string): void {
    this.stopPolling();
    void this.refreshStatus(token);
    this.pollTimer = setInterval(() => {
      void this.refreshStatus(token);
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async refreshStatus(token: string): Promise<void> {
    try {
      const response = await fetch('/api/publish-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as {
        ok?: boolean;
        run?: PublishRun;
      };
      if (!body.run) {
        return;
      }

      this.lastRun.set(body.run);

      const runAgeMs = body.run.updated_at
        ? Date.now() - Date.parse(body.run.updated_at)
        : Number.POSITIVE_INFINITY;
      const isRecent =
        !!body.run.updated_at &&
        Date.parse(body.run.updated_at) >= this.startedAtMs - 15_000;

      if (
        isRecent &&
        body.run.status === 'completed' &&
        body.run.conclusion === 'success'
      ) {
        this.phase.set('success');
        this.isPublishing.set(false);
        this.statusMessage.set(
          this.i18n.t('admin.dashboard.publishSuccess'),
        );
        this.stopPolling();
        return;
      }

      if (
        isRecent &&
        body.run.status === 'completed' &&
        body.run.conclusion &&
        body.run.conclusion !== 'success'
      ) {
        this.phase.set('error');
        this.isPublishing.set(false);
        this.errorMessage.set(
          this.i18n.t('admin.dashboard.publishFailed'),
        );
        this.statusMessage.set(null);
        this.stopPolling();
        return;
      }

      if (body.run.status && body.run.status !== 'completed') {
        this.statusMessage.set(
          this.i18n.t('admin.dashboard.publishPolling') +
            ' ' +
            this.i18n.t('admin.dashboard.publishStatusRunning', {
              status: body.run.status,
            }),
        );
      }

      // Stop polling after 10 minutes to avoid hanging forever.
      if (Date.now() - this.startedAtMs > 10 * 60_000 || runAgeMs < 0) {
        if (this.isPublishing()) {
          this.isPublishing.set(false);
          this.phase.set('idle');
          this.statusMessage.set(
            this.i18n.t('admin.dashboard.publishStarted'),
          );
        }
        this.stopPolling();
      }
    } catch {
      // Ignore transient status errors while polling.
    }
  }
}
