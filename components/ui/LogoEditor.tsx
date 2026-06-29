'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, destroyCloudinary, cldUrl } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';

interface LogoEditorProps {
  churchId: string;
  size?: number;
}

/**
 * Éditeur de logo d'église — version simplifiée d'AvatarEditor.
 * Lit/écrit churches.logo_url + churches.logo_public_id.
 */
export function LogoEditor({ churchId, size = 96 }: LogoEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load current logo
  useEffect(() => {
    if (!churchId) return;
    supabase
      .from('churches')
      .select('logo_url, logo_public_id')
      .eq('id', churchId)
      .maybeSingle()
      .then(({ data }) => {
        setLogoUrl((data?.logo_url as string) ?? null);
        setPublicId((data?.logo_public_id as string) ?? null);
      });
  }, [churchId]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Sélectionnez une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grosse (max 5 Mo)');
      return;
    }
    setUploading(true);
    const old = publicId;
    try {
      const { url, publicId: newId } = await uploadImage(
        file,
        `moneglise/${churchId}/logo`
      );
      const { error } = await supabase
        .from('churches')
        .update({ logo_url: url, logo_public_id: newId, updated_at: new Date().toISOString() })
        .eq('id', churchId);
      if (error) throw error;
      setLogoUrl(url);
      setPublicId(newId);
      if (old) destroyCloudinary(old);
      toast.success('Logo mis à jour');
    } catch (e: any) {
      toast.error("Échec : " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!publicId) return;
    if (!confirm('Supprimer le logo de l\'église ?')) return;
    const old = publicId;
    const { error } = await supabase
      .from('churches')
      .update({ logo_url: null, logo_public_id: null })
      .eq('id', churchId);
    if (error) return toast.error(error.message);
    setLogoUrl(null);
    setPublicId(null);
    destroyCloudinary(old);
    toast.success('Logo supprimé');
  };

  const displayUrl = cldUrl(logoUrl, { w: size * 2, h: size * 2 });

  return (
    <>
      <div className="relative inline-block">
        <div
          className="flex items-center justify-center overflow-hidden rounded-ios-lg bg-brand-100 ring-1 ring-black/5"
          style={{ width: size, height: size }}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Logo église" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-10 w-10 text-brand-600" />
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-ios-lg bg-black/50 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
          </div>
        )}
        {!uploading && (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center shadow-ios-lg active:scale-95 transition-transform"
            aria-label="Changer le logo"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        )}
        {logoUrl && !uploading && (
          <button
            onClick={handleDelete}
            className="absolute -bottom-1 -left-1 h-9 w-9 rounded-full bg-ios-red flex items-center justify-center shadow-ios-lg active:scale-95 transition-transform"
            aria-label="Supprimer le logo"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
    </>
  );
}
