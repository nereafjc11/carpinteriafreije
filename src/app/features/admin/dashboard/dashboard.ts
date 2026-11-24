
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
interface Project {
  id: string;
  title: string;
  category: string;
  published: boolean;
  created_at: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
imports: [CommonModule, RouterLink, RouterLinkActive],  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  projects: Project[] = [];

  totalProjects = 0;
  publishedProjects = 0;
  draftProjects = 0;

  userEmail = '';
  loading = true;
  errorMessage = '';

  async ngOnInit() {
    await this.loadDashboard();
  }

  async loadDashboard() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const user = await this.authService.getUser();
      this.userEmail = user?.email ?? '';

      const { data, error } = await this.supabase.client
        .from('projects')
        .select('id, title, category, published, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.projects = (data ?? []) as Project[];

      this.totalProjects = this.projects.length;

      this.publishedProjects =
        this.projects.filter(p => p.published).length;

      this.draftProjects =
        this.projects.filter(p => !p.published).length;

    } catch (error) {
      console.error(error);
      this.errorMessage =
        'No se pudieron cargar los proyectos.';
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

}
