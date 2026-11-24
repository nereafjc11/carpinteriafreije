
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  ProjectService,
  Project
} from '../../../../core/services/project.service';

interface GalleryImage {
  url: string;
  file?: File;
  existing: boolean;
}

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-form.html',
  styleUrl: './project-form.css'
})
export class ProjectForm implements OnInit, OnDestroy {

  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Datos del proyecto
  projectId: string | null = null;
  isEditMode = false;

  title = '';
  description = '';
  category = '';

  featured = false;
  published = true;

  // Galería de fotografías
  gallery: GalleryImage[] = [];
  removedImages: string[] = [];

  loading = false;
  loadingProject = false;
  errorMessage = '';

  categories = [
    'Escaleras',
    'Puertas',
    'Tejados y estructuras',
    'Suelos',
    'Barandillas y cerramientos',
    'Mobiliario a medida',
    'Carpintería exterior',
    'Otros'
  ];

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  async ngOnInit() {

    this.projectId = this.route.snapshot.paramMap.get('id');

    this.isEditMode = !!this.projectId;

    if (this.isEditMode && this.projectId) {
      await this.loadProject(this.projectId);
    }

  }

  // ==========================================
  // CARGAR PROYECTO PARA EDITAR
  // ==========================================

  async loadProject(id: string) {

    this.loadingProject = true;
    this.errorMessage = '';

    try {

      const project: Project =
        await this.projectService.getProject(id);

      this.title = project.title;
      this.description = project.description ?? '';
      this.category = project.category;

      this.featured = project.featured;
      this.published = project.published;

      const images = project.images?.length
        ? project.images
        : project.image_url
          ? [project.image_url]
          : [];

      this.gallery = images.map(url => ({
        url,
        existing: true
      }));

    } catch (error) {

      console.error('Error cargando proyecto:', error);

      this.errorMessage =
        'No se pudo cargar el proyecto. Comprueba tu conexión y los permisos de Supabase.';

    } finally {

      this.loadingProject = false;

    }

  }

  // ==========================================
  // SELECCIONAR FOTOGRAFÍAS
  // ==========================================

  onFilesSelected(event: Event) {

    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    const files = Array.from(input.files);

    const remaining = 10 - this.gallery.length;

    if (remaining <= 0) {
      this.errorMessage =
        'Ya has alcanzado el máximo de 10 fotografías.';
      input.value = '';
      return;
    }

    let added = 0;

    for (const file of files) {

      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Solo se permiten archivos de imagen.';
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage =
          `La imagen ${file.name} supera los 10 MB.`;
        continue;
      }

      if (added >= remaining) {
        this.errorMessage =
          'Solo puedes añadir un máximo de 10 fotografías.';
        break;
      }

      this.gallery.push({
        url: URL.createObjectURL(file),
        file,
        existing: false
      });

      added++;
    }

    if (added > 0 && !this.errorMessage) {
      this.errorMessage = '';
    }

    input.value = '';

  }

  // ==========================================
  // ELIMINAR FOTOGRAFÍA
  // ==========================================

  removeImage(index: number) {

    const image = this.gallery[index];

    if (!image) return;

    if (image.existing) {
      this.removedImages.push(image.url);
    } else {
      URL.revokeObjectURL(image.url);
    }

    this.gallery.splice(index, 1);

  }

  // ==========================================
  // GUARDAR / ACTUALIZAR PROYECTO
  // ==========================================

  async saveProject() {

    this.errorMessage = '';

    if (!this.title.trim() || !this.category) {
      this.errorMessage =
        'Completa el título y la categoría.';
      return;
    }

    if (this.gallery.length === 0) {
      this.errorMessage =
        'Añade al menos una fotografía.';
      return;
    }

    this.loading = true;

    let uploadedUrls: string[] = [];

    try {

      // Subir solamente las fotografías nuevas

      const newFiles = this.gallery
        .filter(image => !image.existing && image.file)
        .map(image => image.file as File);

      if (newFiles.length > 0) {
        uploadedUrls =
          await this.projectService.uploadImages(newFiles);
      }

      // Mantener el orden de la galería

      let uploadIndex = 0;

      const finalImages = this.gallery.map(image => {

        if (image.existing) {
          return image.url;
        }

        return uploadedUrls[uploadIndex++];

      });

      const projectData = {
        title: this.title.trim(),
        description: this.description.trim(),
        category: this.category,
        image_url: finalImages[0] ?? null,
        images: finalImages,
        featured: this.featured,
        published: this.published
      };

      // CREAR

      if (!this.isEditMode) {

        await this.projectService.createProject(projectData);

      }

      // EDITAR

      else if (this.projectId) {

        await this.projectService.updateProject(
          this.projectId,
          projectData
        );

        // Eliminar fotografías antiguas que ya no se utilizan

        if (this.removedImages.length > 0) {

          try {

            await this.projectService.deleteImages(
              this.removedImages
            );

          } catch (error) {

            console.error(
              'No se pudieron eliminar algunas fotografías antiguas:',
              error
            );

          }

        }

      }

      // Liberar las previsualizaciones locales

      this.gallery
        .filter(image => !image.existing)
        .forEach(image => URL.revokeObjectURL(image.url));

      await this.router.navigate(['/admin/proyectos']);

    } catch (error) {

      console.error('Error guardando proyecto:', error);

      // Limpiar fotografías nuevas si falla el guardado

      if (uploadedUrls.length > 0) {

        try {
          await this.projectService.deleteImages(uploadedUrls);
        } catch (cleanupError) {
          console.error('Error limpiando fotografías:', cleanupError);
        }

      }

      this.errorMessage =
        'No se pudo guardar el proyecto. Comprueba tu conexión y los permisos de Supabase.';

    } finally {

      this.loading = false;

    }

  }

  // ==========================================
  // LIMPIAR PREVISUALIZACIONES
  // ==========================================

  ngOnDestroy() {

    this.gallery
      .filter(image => !image.existing)
      .forEach(image => URL.revokeObjectURL(image.url));

  }


moveImage(index: number, direction: -1 | 1) {

  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= this.gallery.length) {
    return;
  }

  const images = [...this.gallery];

  [images[index], images[newIndex]] =
    [images[newIndex], images[index]];

  this.gallery = images;
}


}
