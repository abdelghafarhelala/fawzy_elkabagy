import { Injectable, inject, signal, computed } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly _session = signal<Session | null>(null);
  private readonly _ready = signal(false);

  readonly session = this._session.asReadonly();
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this._session());
  readonly ready = this._ready.asReadonly();

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    this._session.set(data.session);

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });

    this._ready.set(true);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    this._session.set(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
      throw error;
    }
    this._session.set(null);
  }
}
