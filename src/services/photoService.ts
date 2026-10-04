import { supabase } from '../lib/supabase';
import { ProjectPhoto, PhotoCategory } from '../types';

export interface UploadPhotoInput {
  projectId: string;
  daily_update_id?: string;
  file: File;
  title?: string;
  category?: PhotoCategory;
}

const BUCKET_NAME = 'project-photos';
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export const photoService = {
  /**
   * Fetch all photos for a project and generate dynamic signed URLs
   */
  async getProjectPhotos(projectId: string): Promise<ProjectPhoto[]> {
    const { data: dbPhotos, error: fetchErr } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (fetchErr) {
      console.error('Failed to fetch photos:', fetchErr);
      throw new Error(`Failed to load photos: ${fetchErr.message}`);
    }

    if (!dbPhotos || dbPhotos.length === 0) {
      return [];
    }

    // Generate signed URLs in parallel
    const photos: ProjectPhoto[] = await Promise.all(
      dbPhotos.map(async (p: any) => {
        let signedUrl = '';
        if (p.storage_path) {
          const { data: signedData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(p.storage_path, SIGNED_URL_EXPIRY_SECONDS);
          signedUrl = signedData?.signedUrl || '';
        }

        return {
          id: p.id,
          projectId: p.project_id,
          organization_id: p.organization_id,
          daily_update_id: p.daily_update_id || undefined,
          url: signedUrl,
          title: p.caption || 'Site Progress Photo',
          category: (p.category === 'site_progress' ? 'Site Progress' : 
                     p.category === 'design' ? 'Design' : 
                     p.category === 'materials' ? 'Materials' : 
                     p.category === 'completed' ? 'Completed Work' : 'Site Progress') as PhotoCategory,
          uploadedAt: p.created_at,
          uploadedBy: 'Team Member',
          storage_path: p.storage_path
        };
      })
    );

    return photos;
  },

  /**
   * Upload photo to private Supabase storage and create database record
   */
  async uploadPhoto(input: UploadPhotoInput): Promise<ProjectPhoto> {
    const { file, projectId, daily_update_id, title, category } = input;

    // 1. Validation
    if (!file) {
      throw new Error('No image file provided.');
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File size exceeds 10MB limit. Please upload a smaller image.');
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported format. Please upload a JPEG, PNG, or WebP image.');
    }

    const { data: profile } = await supabase.from('profiles').select('id, organization_id, full_name').single();
    if (!profile?.organization_id) {
      throw new Error('No active organization found. Please sign in again.');
    }

    // 2. Build tenant-isolated storage path: {org_id}/{project_id}/{timestamp}-{clean_name}
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${profile.organization_id}/${projectId}/${Date.now()}-${cleanFilename}`;

    // 3. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }

    // 4. Map category to DB string
    const dbCategory = category === 'Design' ? 'design' :
                       category === 'Materials' ? 'materials' :
                       category === 'Completed Work' ? 'completed' : 'site_progress';

    // 5. Insert row in database
    const { data: dbRow, error: insertError } = await supabase
      .from('project_photos')
      .insert({
        organization_id: profile.organization_id,
        project_id: projectId,
        daily_update_id: daily_update_id || null,
        category: dbCategory,
        caption: title?.trim() || file.name,
        storage_path: storagePath,
        created_by: profile.id
      })
      .select()
      .single();

    if (insertError || !dbRow) {
      console.error('Database record insertion failed, rolling back uploaded file:', insertError);
      // Rollback storage object to prevent orphan
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw new Error(`Failed to save photo metadata: ${insertError?.message}`);
    }

    // 6. Generate signed URL for immediate display
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

    return {
      id: dbRow.id,
      projectId: dbRow.project_id,
      organization_id: dbRow.organization_id,
      daily_update_id: dbRow.daily_update_id || undefined,
      url: signedData?.signedUrl || '',
      title: dbRow.caption || 'Site Progress Photo',
      category: (category || 'Site Progress') as PhotoCategory,
      uploadedAt: dbRow.created_at,
      uploadedBy: profile.full_name || 'Team Member',
      storage_path: dbRow.storage_path
    };
  },

  /**
   * Delete photo from both database and storage
   */
  async deletePhoto(photoId: string, storagePath?: string): Promise<void> {
    // 1. Delete database record
    const { error: dbErr } = await supabase
      .from('project_photos')
      .delete()
      .eq('id', photoId);

    if (dbErr) {
      console.error('Failed to delete photo database record:', dbErr);
      throw new Error(`Failed to delete photo: ${dbErr.message}`);
    }

    // 2. Delete storage object if path provided
    if (storagePath) {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageErr) {
        console.warn('Storage object deletion note:', storageErr.message);
      }
    }
  }
};
