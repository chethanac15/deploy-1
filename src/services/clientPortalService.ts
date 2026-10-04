import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ClientPortalMedia, ClientPortalSnapshot } from '../types';
import { createShareToken, hashShareToken } from '../utils/shareTokens';

export const clientPortalService = {
  async getLinkStatus(projectId: string): Promise<{ expiresAt?: string; active: boolean }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('client_portal_links')
      .select('expires_at, revoked_at')
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) throw error;
    return {
      expiresAt: data?.expires_at,
      active: Boolean(data && !data.revoked_at && new Date(data.expires_at).getTime() > Date.now())
    };
  },

  async createLink(projectId: string, expiresInDays = 30): Promise<{ token: string; expiresAt: string }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
      throw new Error('Portal links can last from 1 to 365 days.');
    }
    const token = createShareToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const tokenHash = await hashShareToken(token);
    const { error } = await supabase.rpc('create_client_portal_link', {
      p_project_id: projectId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt
    });
    if (error) throw error;
    return { token, expiresAt };
  },

  async revokeLink(projectId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('revoke_client_portal_link', { p_project_id: projectId });
    if (error) throw error;
  },

  async getSharedPortal(token: string): Promise<ClientPortalSnapshot> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('get_shared_client_portal', { p_token: token });
    if (error) throw error;
    if (!data?.project) throw new Error('The client portal returned an invalid project snapshot.');
    return {
      project: {
        name: data.project.name,
        location: data.project.location || undefined,
        project_type: data.project.project_type || undefined,
        status: data.project.status || 'on_track',
        start_date: data.project.start_date || undefined,
        deadline: data.project.deadline || undefined,
        contract_value: data.project.contract_value === null ? undefined : Number(data.project.contract_value),
        progress: Number(data.project.progress) || 0
      },
      expires_at: data.expires_at,
      milestones: Array.isArray(data.milestones) ? data.milestones : [],
      updates: Array.isArray(data.updates) ? data.updates : [],
      payments: Array.isArray(data.payments) ? data.payments.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount) || 0,
        paid_amount: Number(payment.paid_amount) || 0
      })) : [],
      media: Array.isArray(data.media) ? data.media.map((item: any) => ({
        url: supabase.storage.from('client-portal-media').getPublicUrl(item.storage_path).data.publicUrl,
        caption: item.caption || '',
        created_at: item.created_at
      })) : []
    };
  },

  async uploadClientPhoto(input: {
    organizationId: string;
    projectId: string;
    userId: string;
    file: File;
    caption: string;
  }): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(input.file.type)) throw new Error('Use a JPEG, PNG, or WebP image.');
    if (input.file.size > 10 * 1024 * 1024) throw new Error('Client portal images must be 10 MB or smaller.');
    if (!input.caption.trim()) throw new Error('Add a caption so clients know what the photo shows.');

    const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${input.organizationId}/${input.projectId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from('client-portal-media')
      .upload(storagePath, input.file, { upsert: false, contentType: input.file.type });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from('client_portal_media').insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      storage_path: storagePath,
      caption: input.caption.trim(),
      created_by: input.userId
    });
    if (insertError) {
      const { error: cleanupError } = await supabase.storage.from('client-portal-media').remove([storagePath]);
      if (cleanupError) {
        throw new Error(`Could not save the photo metadata (${insertError.message}) or clean up the uploaded file (${cleanupError.message}).`);
      }
      throw insertError;
    }
  },

  async getManagedPhotos(projectId: string): Promise<ClientPortalMedia[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('client_portal_media')
      .select('id, storage_path, caption, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      storage_path: item.storage_path,
      caption: item.caption,
      created_at: item.created_at,
      url: supabase.storage.from('client-portal-media').getPublicUrl(item.storage_path).data.publicUrl
    }));
  },

  async deleteClientPhoto(projectId: string, storagePath: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { error: storageError } = await supabase.storage.from('client-portal-media').remove([storagePath]);
    if (storageError) throw storageError;
    const { error: rowError } = await supabase.from('client_portal_media')
      .delete()
      .eq('project_id', projectId)
      .eq('storage_path', storagePath);
    if (rowError) throw rowError;
  }
};
