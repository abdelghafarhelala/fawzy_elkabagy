import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AdminService } from '../../core/services/admin.service';
import { LanguageService } from '../../core/services/language.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-contact-us',
  imports: [TranslatePipe],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
})
export class ContactUs implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage = this.languageService.currentLanguage;

  hotline = signal('');
  private hoursEn = signal('');
  private hoursAr = signal('');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly displayHours = computed(() =>
    this.currentLanguage() === 'ar' ? this.hoursAr() : this.hoursEn(),
  );

  async ngOnInit(): Promise<void> {
    try {
      const reach = await this.menuService.getReachOutInfo();
      if (reach) {
        this.hotline.set((reach.phone ?? '').trim());
        this.hoursEn.set(reach.hours_en);
        this.hoursAr.set(reach.hours_ar);
      }
    } catch {
      // Form still works without hours.
    }
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const fullName = String(data.get('fullName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const subject = String(data.get('subject') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!fullName || !email || !message) {
      this.errorMessage.set('Please fill name, email, and message.');
      this.successMessage.set(null);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.admin.submitContactMessage({
        full_name: fullName,
        email,
        subject,
        message,
      });
      form.reset();
      this.successMessage.set('Message sent. Thank you!');
    } catch {
      this.errorMessage.set('Could not send message. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
