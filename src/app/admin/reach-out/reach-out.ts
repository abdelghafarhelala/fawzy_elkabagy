import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-reach-out',
  imports: [FormsModule],
  templateUrl: './reach-out.html',
  styleUrl: '../admin.css',
})
export class AdminReachOut implements OnInit {
  private readonly admin = inject(AdminService);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = {
    id: '' as string | undefined,
    location_en: '',
    location_ar: '',
    phone: '',
    hours_en: '',
    hours_ar: '',
  };

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const row = await this.admin.getReachOut();
      if (row) {
        this.form = {
          id: row.id,
          location_en: row.location_en,
          location_ar: row.location_ar,
          phone: row.phone,
          hours_en: row.hours_en,
          hours_ar: row.hours_ar,
        };
      }
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to load reach out'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await this.admin.updateReachOut({
        ...(this.form.id ? { id: this.form.id } : {}),
        location_en: this.form.location_en.trim(),
        location_ar: this.form.location_ar.trim(),
        phone: this.form.phone.trim(),
        hours_en: this.form.hours_en.trim(),
        hours_ar: this.form.hours_ar.trim(),
      });
      this.successMessage.set('Reach Out saved.');
    } catch (err: unknown) {
      this.errorMessage.set(this.errMsg(err, 'Failed to save'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message);
    }
    return fallback;
  }
}
