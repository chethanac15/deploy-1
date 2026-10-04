// ==============================================================================
// APNI ESTATE INTERIORS - DOCUMENT SERVICE (SUPABASE STORAGE & SECURE VAULT)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DocumentItem, DocumentCategory } from '../types';

export interface UploadDocumentInput {
  organizationId: string;
  projectId?: string;
  title: string;
  category: DocumentCategory;
  file: File;
  userId?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const documentService = {
  async getDocuments(params?: { projectId?: string; organizationId?: string }): Promise<DocumentItem[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('documents')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (params?.organizationId) {
      query = query.eq('organization_id', params.organizationId);
    }
    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      project_id: item.project_id,
      projectId: item.project_id || '',
      projectName: item.projects?.name || 'General Studio Vault',
      title: item.title,
      category: item.category as DocumentCategory,
      type: item.category,
      file_name: item.file_name,
      file_size: item.file_size,
      size: formatFileSize(item.file_size || 0),
      file_type: item.file_type,
      storage_path: item.storage_path,
      created_by: item.created_by,
      created_at: item.created_at,
      updatedAt: item.updated_at || item.created_at
    }));
  },

  async uploadDocument(input: UploadDocumentInput): Promise<DocumentItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. File size check (25MB limit)
    const maxBytes = 26214400; // 25 MB
    if (input.file.size > maxBytes) {
      throw new Error(`File size (${(input.file.size / 1048576).toFixed(1)}MB) exceeds maximum limit of 25MB.`);
    }

    // 2. Build tenant-isolated storage path: "<organization_id>/<project_id_or_general>/<timestamp_sanitized_name>"
    const sanitizedName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = input.projectId ? input.projectId : 'general';
    const storagePath = `${input.organizationId}/${folder}/${Date.now()}_${sanitizedName}`;

    // 3. Upload to private Supabase Storage bucket 'documents'
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, input.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 4. Insert metadata record in documents table
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId || null,
        title: input.title.trim(),
        category: input.category,
        file_name: input.file.name,
        file_size: input.file.size,
        file_type: input.file.type || null,
        storage_path: storagePath,
        created_by: input.userId || null
      })
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .single();

    if (dbError) {
      // Rollback uploaded storage file on DB insert error
      try {
        await supabase.storage.from('documents').remove([storagePath]);
      } catch (e) {}
      throw dbError;
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      projectId: data.project_id || '',
      projectName: data.projects?.name || 'General Studio Vault',
      title: data.title,
      category: data.category as DocumentCategory,
      type: data.category,
      file_name: data.file_name,
      file_size: data.file_size,
      size: formatFileSize(data.file_size || 0),
      file_type: data.file_type,
      storage_path: data.storage_path,
      created_by: data.created_by,
      created_at: data.created_at,
      updatedAt: data.updated_at || data.created_at
    };
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600); // 1 hour validity

    if (error) throw error;
    return data.signedUrl;
  },

  async deleteDocument(id: string, storagePath?: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Delete DB record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // 2. Delete storage file if path exists
    if (storagePath) {
      try {
        await supabase.storage
          .from('documents')
          .remove([storagePath]);
      } catch (storageErr) {
        console.warn('[DocumentService] Failed to clean up storage object:', storageErr);
      }
    }
  }
};
