import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ContactMessage } from '../../core/models/admin.models';
import { AdminService } from '../../core/services/admin.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './messages.html',
  styleUrl: '../admin.css',
})
export class AdminMessages implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly i18n = inject(TranslationService);

  messages = signal<ContactMessage[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.messages.set(await this.admin.listMessages());
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.messages.loadFailed')),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleRead(msg: ContactMessage): Promise<void> {
    try {
      await this.admin.setMessageRead(msg.id, !msg.is_read);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.messages.updateFailed')),
      );
    }
  }

  async remove(msg: ContactMessage): Promise<void> {
    if (
      !confirm(
        this.i18n.t('admin.messages.deleteConfirm', {
          name: msg.full_name,
        }),
      )
    ) {
      return;
    }
    try {
      await this.admin.deleteMessage(msg.id);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(
        this.errMsg(err, this.i18n.t('admin.messages.deleteFailed')),
      );
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
