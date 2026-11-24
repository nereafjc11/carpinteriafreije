
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ProjectService,
  Project
} from '../../../../core/services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {

  private projectService = inject(ProjectService);

  projects: Project[] = [];

  loading = true;
  errorMessage = '';

  search = '';

  filter: 'all' | 'published' | 'draft' = 'all';

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  async ngOnInit() {
    await this.loadProjects();
  }

  // ==========================================
  // CARGAR PROYECTOS
  // ==========================================

  async loadProjects() {

    this.loading = true;
    this.errorMessage = '';

    try {

      this.projects = await this.projectService.getProjects();

    } catch (error) {

      console.error('Error cargando proyectos:', error);

      this.errorMessage =
        'No se pudieron cargar los proyectos.';

    } finally {

      this.loading = false;

    }
  }

  // ==========================================
  // BÚSQUEDA Y FILTROS
  // ==========================================

  get filteredProjects(): Project[] {

    return this.projects.filter(project => {

      const searchText = this.search.toLowerCase().trim();

      const matchesSearch =
        project.title.toLowerCase().includes(searchText) ||
        project.category.toLowerCase().includes(searchText);

      const matchesFilter =
        this.filter === 'all' ||
        (this.filter === 'published' && project.published) ||
        (this.filter === 'draft' && !project.published);

      return matchesSearch && matchesFilter;

    });

  }

  // ==========================================
  // PUBLICAR / DESPUBLICAR
  // ==========================================

  async togglePublished(project: Project) {

    try {

      const newStatus = !project.published;

      await this.projectService.updatePublished(
        project.id,
        newStatus
      );

      project.published = newStatus;

    } catch (error) {

      console.error('Error cambiando publicación:', error);

      alert(
        'No se pudo cambiar el estado del proyecto.'
      );

    }
  }

  // ==========================================
  // ELIMINAR PROYECTO
  // ==========================================

  async deleteProject(project: Project) {

    const confirmed = confirm(
      `¿Seguro que quieres eliminar "${project.title}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {

      await this.projectService.deleteProject(
        project.id
      );

      this.projects = this.projects.filter(
        p => p.id !== project.id
      );

    } catch (error) {

      console.error('Error eliminando proyecto:', error);

      alert(
        'No se pudo eliminar el proyecto.'
      );

    }
  }

}
