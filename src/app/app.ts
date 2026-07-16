import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly languageService = inject(LanguageService);

  constructor() {
    this.languageService.initLanguage();
    // Resolve public assets against <base href> (needed for GitHub Pages)
    document.documentElement.style.setProperty(
      '--pm-hero-image',
      `url('${document.baseURI}images/hero.jpg')`,
    );
  }
}
