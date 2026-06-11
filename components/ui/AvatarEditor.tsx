'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2, Image as ImageIcon, Folder, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, destroyCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from './Avatar';
import { IOSAlert } from './IOSAlert';
import { BottomSheet } from './BottomSheet';

interface AvatarEditorProps {
  size?: number;
}

/** Avatar éditable : tap pour choisir Galerie / Caméra / Fichiers */
export function AvatarEditor({ size = 96 }: AvatarEditorProps) {
  const { user, updateLocalAvatar } = useAuth();

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) return null;

  const openPicker = () => setSheetOpen(true);

  const handleFile = async (file: File) => {
    setSheetOpen(false);
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
            onClick={openPicker}
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

      {/* Inputs cachés : un par source */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (galleryRef.current) galleryRef.current.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (cameraRef.current) cameraRef.current.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />

      {/* Action sheet : choix de la source */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Choisir une photo"
      >
        <div className="px-5 pb-6 pt-2 space-y-2">
          <SheetButton
            icon={<ImageIcon className="h-5 w-5" />}
            label="Photothèque"
            description="Choisir depuis vos photos"
            onClick={() => galleryRef.current?.click()}
          />
          <SheetButton
            icon={<Camera className="h-5 w-5" />}
            label="Prendre une photo"
            description="Ouvrir l'appareil photo"
            onClick={() => cameraRef.current?.click()}
          />
          <SheetButton
            icon={<Folder className="h-5 w-5" />}
            label="Parcourir les fichiers"
            description="Sélectionner depuis Fichiers"
            onClick={() => fileRef.current?.click()}
          />
          <button
            onClick={() => setSheetOpen(false)}
            className="w-full mt-2 px-4 py-3.5 rounded-ios-lg bg-ios-gray6 text-ios-label-light font-semibold active:bg-ios-gray5 flex items-center justify-center gap-2"
          >
            <X className="h-5 w-5" />
            Annuler
          </button>
        </div>
      </BottomSheet>

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

function SheetButton({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3.5 rounded-ios-lg bg-brand-50 text-left active:bg-brand-100 flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-ios bg-white text-brand-600 shadow-ios-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-brand-600">{label}</p>
        <p className="text-[12px] text-ios-gray">{description}</p>
      </div>
    </button>
  );
}
