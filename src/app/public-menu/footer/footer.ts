import { Component, OnInit, inject, output, signal } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LocationBranch } from '../../core/models/admin.models';
import { LanguageService } from '../../core/services/language.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage = this.languageService.currentLanguage;

  locations = signal<LocationBranch[]>([]);
  navigate = output<{ sectionId: string; event: Event }>();

  async ngOnInit(): Promise<void> {
    try {
      this.locations.set(await this.menuService.getLocations());
    } catch {
      this.locations.set([]);
    }
  }

  branchName(loc: LocationBranch): string {
    return this.currentLanguage() === 'ar' ? loc.name_ar : loc.name_en;
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  onNavigate(sectionId: string, event: Event): void {
    this.navigate.emit({ sectionId, event });
  }
}
