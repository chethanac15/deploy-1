-- ==============================================================================
-- APNI ESTATE INTERIORS - PHASE 6 STORAGE RLS POLICIES FOR PROJECT PHOTOS
-- ==============================================================================

-- Ensure bucket 'project-photos' exists and is private
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-photos',
  'project-photos',
  false,
  10485760, -- 10 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760;

-- 1. RLS Policy: Users can select/view photos belonging to their organization
create policy "Tenant Select Project Photos"
  on storage.objects for select
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );

-- 2. RLS Policy: Users can insert/upload photos under their organization folder
create policy "Tenant Insert Project Photos"
  on storage.objects for insert
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );

-- 3. RLS Policy: Users can delete photos under their organization folder
create policy "Tenant Delete Project Photos"
  on storage.objects for delete
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );
