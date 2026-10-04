// ==============================================================================
// APNI ESTATE INTERIORS - VENDOR SERVICE
// Multi-tenant vendor catalog management with categories & search
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Vendor, VendorCategory } from '../types';

export interface CreateVendorInput {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  category: VendorCategory;
  gst_number?: string;
  rating?: number;
  notes?: string;
}

export const vendorService = {
  async getVendors(organizationId?: string): Promise<Vendor[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((v: any) => ({
      id: v.id,
      organization_id: v.organization_id,
      name: v.name,
      contact_person: v.contact_person || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      category: v.category as VendorCategory,
      gst_number: v.gst_number || '',
      rating: Number(v.rating) || 5,
      notes: v.notes || '',
      created_at: v.created_at,
      updated_at: v.updated_at
    }));
  },

  async createVendor(organizationId: string, input: CreateVendorInput): Promise<Vendor> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        contact_person: input.contact_person?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        category: input.category,
        gst_number: input.gst_number?.trim() || null,
        rating: input.rating || 5,
        notes: input.notes?.trim() || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      category: data.category as VendorCategory,
      gst_number: data.gst_number || '',
      rating: Number(data.rating) || 5,
      notes: data.notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateVendor(vendorId: string, input: Partial<CreateVendorInput>): Promise<Vendor> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.contact_person !== undefined) updatePayload.contact_person = input.contact_person?.trim() || null;
    if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null;
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;
    if (input.address !== undefined) updatePayload.address = input.address?.trim() || null;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.gst_number !== undefined) updatePayload.gst_number = input.gst_number?.trim() || null;
    if (input.rating !== undefined) updatePayload.rating = input.rating;
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;

    const { data, error } = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', vendorId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      category: data.category as VendorCategory,
      gst_number: data.gst_number || '',
      rating: Number(data.rating) || 5,
      notes: data.notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteVendor(vendorId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) throw error;
  }
};
