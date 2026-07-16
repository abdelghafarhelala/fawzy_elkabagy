import { Injectable, signal, computed, effect, inject, EventEmitter } from '@angular/core';
import { Directionality, Direction } from '@angular/cdk/bidi';

// Re-export Direction from cdk/bidi to avoid conflicts and ensure perfect type matching
export type { Direction } from '@angular/cdk/bidi';

@Injectable({
  providedIn: 'root'
})
export class DirectionService implements Directionality {
  private readonly DIRECTION_KEY = 'menu-direction';
  private _direction = signal<Direction>('ltr'); // Default to LTR
  
  readonly change = new EventEmitter<Direction>();
  
  get value(): 'ltr' | 'rtl' {
    return this._direction();
  }

  // Public readonly signal for direction
  direction = computed(() => this._direction());

  // Required by Directionality interface in newer CDK versions
  readonly valueSignal = this._direction;

  ngOnDestroy(): void {
    this.change.complete();
  }

  // Computed properties for easy use in templates
  isRTL = computed(() => this._direction() === 'rtl');
  isLTR = computed(() => this._direction() === 'ltr');

  constructor() {
    // Apply direction changes immediately when signal changes
    // This effect will automatically apply direction when _direction signal changes
    effect(() => {
      // Only apply if document is available (not during SSR)
      if (typeof document !== 'undefined') {
        this.applyDirection(this._direction());
      }
    });
  }

  /**
   * Initialize direction from localStorage or default to RTL
   * Note: The effect in constructor will automatically apply the direction when _direction.set() is called
   */
  initDirection(): void {
    const savedDirection = localStorage.getItem(this.DIRECTION_KEY) as Direction;
    if (savedDirection && (savedDirection === 'ltr' || savedDirection === 'rtl')) {
      this._direction.set(savedDirection);
    } else {
      // Default to RTL for first-time users
      this._direction.set('rtl');
      localStorage.setItem(this.DIRECTION_KEY, 'rtl');
    }
    // No need to call applyDirection() here - the effect will handle it
  }

  /**
   * Set direction programmatically
   */
  setDirection(dir: Direction): void {
    this._direction.set(dir);
    localStorage.setItem(this.DIRECTION_KEY, dir);
    this.change.emit(dir);
  }

  /**
   * Get current direction value
   */
  getDirection(): Direction {
    return this._direction();
  }

  /**
   * Toggle between LTR and RTL
   */
  toggleDirection(): void {
    const newDirection: Direction = this._direction() === 'ltr' ? 'rtl' : 'ltr';
    // this.languageService.setLanguage(newDirection === 'ltr' ? 'ar' : 'en');
    this.setDirection(newDirection);
  }

  /**
   * Apply direction to DOM
   */
  private applyDirection(dir: Direction): void {
    const html = document.documentElement;
    const body = document.body;

    html.setAttribute('dir', dir);
    body.setAttribute('dir', dir);

    // Force reflow to ensure direction change is applied
    void html.offsetHeight;
  }

  resetToDefault(): void {
    localStorage.removeItem(this.DIRECTION_KEY);
    this.setDirection('rtl'); // Default to RTL on logout
  }
}

