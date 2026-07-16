import { Component, output } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  navigate = output<{ sectionId: string; event: Event }>();

  onNavigate(sectionId: string, event: Event): void {
    this.navigate.emit({ sectionId, event });
  }
}
