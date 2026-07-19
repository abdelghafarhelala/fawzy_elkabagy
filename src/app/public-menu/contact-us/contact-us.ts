import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LocationBranch } from '../../core/models/admin.models';
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

  locations = signal<LocationBranch[]>([]);
  hotline = signal('');
  private hoursEn = signal('');
  private hoursAr = signal('');
  selectedId = signal<string | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly displayHours = computed(() =>
    this.currentLanguage() === 'ar' ? this.hoursAr() : this.hoursEn(),
  );

  async ngOnInit(): Promise<void> {
    try {
      const [locs, reach] = await Promise.all([
        this.menuService.getLocations(),
        this.menuService.getReachOutInfo(),
      ]);
      this.locations.set(locs);
      if (reach) {
        this.hotline.set((reach.phone ?? '').trim());
        this.hoursEn.set(reach.hours_en);
        this.hoursAr.set(reach.hours_ar);
      }
    } catch {
      // Keep empty lists; form still works.
    }
  }

  branchName(loc: LocationBranch): string {
    return this.currentLanguage() === 'ar' ? loc.name_ar : loc.name_en;
  }

  branchAddress(loc: LocationBranch): string {
    return this.currentLanguage() === 'ar'
      ? loc.address_ar
      : loc.address_en;
  }

  selectBranch(id: string): void {
    this.selectedId.set(id);
  }

  selectedMapUrl(): string | null {
    const id = this.selectedId();
    const loc = this.locations().find((l) => l.id === id);
    return loc?.map_url?.trim() || null;
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
