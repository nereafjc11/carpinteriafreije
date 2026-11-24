
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase/supabase.service';

// Modelo de proyecto
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  images: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Datos para crear un proyecto
export interface ProjectInput {
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  images: string[];
  featured: boolean;
  published: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private supabase = inject(SupabaseService);

  private table = 'projects';
  private bucket = 'project-images';

  // ==========================================
  // OBTENER TODOS LOS PROYECTOS
  // ==========================================

  async getProjects(): Promise<Project[]> {

    const { data, error } = await this.supabase.client
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as Project[];
  }

  // ==========================================
  // OBTENER PROYECTOS PUBLICADOS
  // ==========================================

  async getPublishedProjects(): Promise<Project[]> {

    const { data, error } = await this.supabase.client
      .from(this.table)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as Project[];
  }

  // ==========================================
  // OBTENER UN PROYECTO POR ID
  // ==========================================

  async getProject(id: string): Promise<Project> {

    const { data, error } = await this.supabase.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as Project;
  }

  // ==========================================
  // SUBIR FOTOGRAFÍAS A SUPABASE STORAGE
  // ==========================================

  async uploadImages(files: File[]): Promise<string[]> {

    if (files.length > 10) {
      throw new Error('Solo puedes subir un máximo de 10 fotografías.');
    }

    const urls: string[] = [];

    for (const file of files) {

      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`La imagen ${file.name} supera los 10 MB.`);
      }

      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} no es una imagen válida.`);
      }

      const extension =
        file.name.split('.').pop()?.toLowerCase() || 'jpg';

      const path = `${crypto.randomUUID()}.${extension}`;

      const { error } = await this.supabase.client.storage
        .from(this.bucket)
        .upload(path, file);

      if (error) throw error;

      const { data } = this.supabase.client.storage
        .from(this.bucket)
        .getPublicUrl(path);

      urls.push(data.publicUrl);
    }

    return urls;
  }

  // ==========================================
  // ELIMINAR FOTOGRAFÍAS DE STORAGE
  // ==========================================

  async deleteImages(urls: string[]): Promise<void> {

    if (!urls.length) return;

    const paths = urls
      .map(url => {
        const marker = `/${this.bucket}/`;
        const index = url.indexOf(marker);

        return index >= 0
          ? decodeURIComponent(url.substring(index + marker.length).split('?')[0])
          : null;
      })
      .filter((path): path is string => path !== null);

    if (!paths.length) return;

    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .remove(paths);

    if (error) throw error;
  }

  // ==========================================
  // CREAR PROYECTO
  // ==========================================

  async createProject(project: ProjectInput): Promise<Project> {

    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert(project)
      .select()
      .single();

    if (error) throw error;

    return data as Project;
  }

  // ==========================================
  // ACTUALIZAR PROYECTO
  // ==========================================

  async updateProject(
    id: string,
    project: Partial<ProjectInput>
  ): Promise<Project> {

    const { data, error } = await this.supabase.client
      .from(this.table)
      .update({
        ...project,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as Project;
  }

  // ==========================================
  // PUBLICAR / DESPUBLICAR PROYECTO
  // ==========================================

  async updatePublished(
    id: string,
    published: boolean
  ): Promise<void> {

    const { error } = await this.supabase.client
      .from(this.table)
      .update({
        published,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // DESTACAR / QUITAR DESTACADO
  // ==========================================

  async updateFeatured(
    id: string,
    featured: boolean
  ): Promise<void> {

    const { error } = await this.supabase.client
      .from(this.table)
      .update({
        featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // ELIMINAR PROYECTO
  // ==========================================

  async deleteProject(id: string): Promise<void> {

    const { error } = await this.supabase.client
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

}
