import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { StateRegistrationDocument } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = 'state-documents';

export function useStateDocuments() {
  const { organization, user } = useAuth();
  const [documents, setDocuments] = useState<StateRegistrationDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});

  const fetchDocuments = useCallback(async (stateRegistrationId: string) => {
    setLoadingDocs(true);
    const { data } = await supabase
      .from('state_registration_documents')
      .select('*')
      .eq('state_registration_id', stateRegistrationId)
      .order('created_at', { ascending: false });
    setDocuments(data ?? []);
    setLoadingDocs(false);
  }, []);

  const fetchDocCounts = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('state_registration_documents')
      .select('state_registration_id')
      .eq('organization_id', organization.id);

    const counts: Record<string, number> = {};
    (data ?? []).forEach((row) => {
      counts[row.state_registration_id] = (counts[row.state_registration_id] || 0) + 1;
    });
    setDocCounts(counts);
  }, [organization]);

  const uploadDocument = useCallback(async (stateRegistrationId: string, file: File) => {
    if (!organization || !user) return null;
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File exceeds 10 MB limit');
      return null;
    }

    setUploading(true);
    const fileId = crypto.randomUUID();
    const ext = file.name.split('.').pop() || '';
    const storagePath = `${organization.id}/${stateRegistrationId}/${fileId}${ext ? '.' + ext : ''}`;

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type });

    if (storageError) {
      setUploadError(storageError.message);
      setUploading(false);
      return null;
    }

    const { data: doc, error: dbError } = await supabase
      .from('state_registration_documents')
      .insert({
        state_registration_id: stateRegistrationId,
        organization_id: organization.id,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        content_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .maybeSingle();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      setUploadError(dbError.message);
      setUploading(false);
      return null;
    }

    setUploading(false);
    if (doc) {
      setDocuments((prev) => [doc, ...prev]);
    }
    return doc;
  }, [organization, user]);

  const deleteDocument = useCallback(async (documentId: string, filePath: string) => {
    await supabase.storage.from(BUCKET).remove([filePath]);
    await supabase.from('state_registration_documents').delete().eq('id', documentId);
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
  }, []);

  const getDownloadUrl = useCallback(async (filePath: string) => {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 300);
    return data?.signedUrl ?? null;
  }, []);

  const deleteAllForRegistration = useCallback(async (stateRegistrationId: string) => {
    const { data: docs } = await supabase
      .from('state_registration_documents')
      .select('file_path')
      .eq('state_registration_id', stateRegistrationId);

    if (docs && docs.length > 0) {
      await supabase.storage.from(BUCKET).remove(docs.map((d) => d.file_path));
    }
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
    setUploadError(null);
  }, []);

  return {
    documents,
    loadingDocs,
    uploading,
    uploadError,
    docCounts,
    fetchDocuments,
    fetchDocCounts,
    uploadDocument,
    deleteDocument,
    deleteAllForRegistration,
    getDownloadUrl,
    clearDocuments,
  };
}
