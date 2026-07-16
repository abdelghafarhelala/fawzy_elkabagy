import { Component } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-story',
  imports: [TranslatePipe],
  templateUrl: './story.html',
  styleUrl: './story.css',
})
export class Story {}
