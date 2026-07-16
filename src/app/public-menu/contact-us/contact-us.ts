import { Component } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contact-us',
  imports: [TranslatePipe],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
})
export class ContactUs {
  onSubmit(event: Event): void {
    event.preventDefault();
  }
}
