import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ContactMessage } from '../../core/models/admin.models';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe],
  templateUrl: './messages.html',
  styleUrl: '../admin.css',
})
export class AdminMessages implements OnInit {
  private readonly admin = inject(AdminService);

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
      this.errorMessage.set(this.errMsg(err, 'Failed to load messages'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleRead(msg: ContactMessage): Promise<void> {
    try {
      await this.admin.setMessageRead(msg.id, !msg.is_read);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to update'));
    }
  }

  async remove(msg: ContactMessage): Promise<void> {
    if (!confirm(`Delete message from ${msg.full_name}?`)) {
      return;
    }
    try {
      await this.admin.deleteMessage(msg.id);
      await this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to delete'));
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
