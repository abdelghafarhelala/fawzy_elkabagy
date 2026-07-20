import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LocationBranch } from '../../core/models/admin.models';
import { LanguageService } from '../../core/services/language.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-branches',
  imports: [TranslatePipe],
  templateUrl: './branches.html',
  styleUrl: './branches.css',
})
export class Branches implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage = this.languageService.currentLanguage;
  locations = signal<LocationBranch[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const locs = await this.menuService.getLocations();
      this.locations.set(locs);
    } catch {
      this.locations.set([]);
    }
  }

  branchName(loc: LocationBranch): string {
    return this.currentLanguage() === 'ar' ? loc.name_ar : loc.name_en;
  }

  branchAddress(loc: LocationBranch): string {
    return this.currentLanguage() === 'ar' ? loc.address_ar : loc.address_en;
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }
}
