
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { ProjectService } from '../../../../core/services/project.service';

interface ProjectRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  images: string[] | null;
  featured: boolean;
  published: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements OnInit {

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  projects: Project[] = [];

  loading = true;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {

    this.loading = true;
    this.errorMessage = '';

    this.cdr.markForCheck();

    try {

      const data = await this.projectService.getPublishedProjects();

      console.log('Proyectos recibidos de Supabase:', data);

      const records = data as ProjectRecord[];

      this.projects = [...records]
        .sort((a, b) => {

          // Primero los proyectos destacados
          if (a.featured !== b.featured) {
            return Number(b.featured) - Number(a.featured);
          }

          // Después los más recientes
          return new Date(b.created_at).getTime() -
                 new Date(a.created_at).getTime();
        })
        .map(project => {

          // Primero image_url, después la primera imagen
          const image =
            project.image_url?.trim() ||
            project.images?.find(url => !!url) ||
            '';

          return {
            id: project.id,
            title: project.title,
            category: project.category,
            image,
            description: project.description || ''
          };
        });

      console.log('Proyectos preparados para mostrar:', this.projects);

    } catch (error) {

      console.error('Error cargando proyectos:', error);

      this.errorMessage =
        'No se pudieron cargar los proyectos.';

    } finally {

      this.loading = false;

      // Actualizar la vista de Angular
      this.cdr.markForCheck();
    }
  }
}
