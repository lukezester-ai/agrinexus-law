-- Документооборот — document management
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  category text,
  file_url text NOT NULL,
  file_type text,
  file_size numeric,
  linked_module text,
  linked_entity_id text,
  description text,
  tags text,
  is_pinned boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant_documents', 'tenant_documents', true, 52428800, '{application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv}')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to tenant_documents
CREATE POLICY "authenticated can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tenant_documents');

CREATE POLICY "authenticated can select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant_documents');

CREATE POLICY "authenticated can delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tenant_documents');
