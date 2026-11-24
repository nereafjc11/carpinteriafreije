
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase/supabase.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabaseService = inject(SupabaseService);

  // Iniciar sesión
  async login(email: string, password: string) {
    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    return data;
  }

  // Cerrar sesión
  async logout() {
    const { error } =
      await this.supabaseService.client.auth.signOut();

    if (error) throw error;
  }

  // Comprobar sesión
  async isAuthenticated(): Promise<boolean> {
    const { data, error } =
      await this.supabaseService.client.auth.getSession();

    return !error && !!data.session;
  }

  // Obtener usuario
  async getUser() {
    const { data, error } =
      await this.supabaseService.client.auth.getUser();

    if (error) return null;

    return data.user;
  }

}
