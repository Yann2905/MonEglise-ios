'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, destroyCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from './Avatar';
import { IOSAlert } from './IOSAlert';

interface AvatarEditorProps {
  size?: number;
}

/** Avatar éditable : tap pour changer la photo */
export function AvatarEditor({ size = 96 }: AvatarEditorProps) {
  const { user, updateLocalAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const triggerPick = () => fileRef.current?.click();

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
    const oldPublicId = user.avatar_public_id;
    try {
      const folder = `moneglise/${user.church_id ?? 'misc'}/avatars`;
      const { url, publicId } = await uploadImage(file, folder);

      const { error } = await supabase
        .from('users')
        .update({ avatar_url: url, avatar_public_id: publicId, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;

      updateLocalAvatar(url, publicId);
      // Supprime l'ancienne (best-effort)
      if (oldPublicId) destroyCloudinary(oldPublicId);
      toast.success('Photo mise à jour');
    } catch (e: any) {
      toast.error("Échec : " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const oldPublicId = user.avatar_public_id;
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: null, avatar_public_id: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) return toast.error(error.message);
    updateLocalAvatar(null, null);
    if (oldPublicId) destroyCloudinary(oldPublicId);
    toast.success('Photo supprimée');
    setConfirmDelete(false);
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar
          firstName={user.first_name}
          lastName={user.last_name}
          src={user.avatar_url}
          size={size}
        />
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
          </div>
        )}
        {!uploading && (
          <button
            onClick={triggerPick}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center shadow-ios-lg active:scale-95 transition-transform"
            aria-label="Changer la photo"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        )}
        {user.avatar_url && !uploading && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute -bottom-1 -left-1 h-9 w-9 rounded-full bg-ios-red flex items-center justify-center shadow-ios-lg active:scale-95 transition-transform"
            aria-label="Supprimer la photo"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />

      <IOSAlert
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer la photo ?"
        message="Votre avatar redeviendra vos initiales."
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Supprimer', variant: 'destructive', onClick: handleDelete },
        ]}
      />
    </>
  );
}
