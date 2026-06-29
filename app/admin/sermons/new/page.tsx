'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { notify, allChurchMemberIds } from '@/lib/notifications';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const AUDIO_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_AUDIO_PRESET!;

export default function NewSermonPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [theme, setTheme] = useState('');
  const [verses, setVerses] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAudio = (): Promise<{ url: string; publicId: string }> => {
    if (!audioFile || !user?.church_id) throw new Error('Données manquantes');
    return new Promise((resolve, reject) => {
      const ts = Date.now();
      const publicId = `sermon_${ts}`;
      const folder = `moneglise/${user.church_id}/sermons`;

      const form = new FormData();
      form.append('file', audioFile);
      form.append('upload_preset', AUDIO_PRESET);
      form.append('folder', folder);
      form.append('public_id', publicId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const r = JSON.parse(xhr.responseText);
          resolve({ url: r.secure_url, publicId: r.public_id });
        } else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  };

  const handleSubmit = async () => {
    if (!theme.trim()) return toast.error('Le thème est obligatoire');
    if (!user?.church_id) return;

    setSaving(true);
    try {
      let audioUrl: string | null = null;
      let audioPublicId: string | null = null;

      if (audioFile) {
        const r = await uploadAudio();
        audioUrl = r.url;
        audioPublicId = r.publicId;
      }

      const { error } = await supabase.from('sermons').insert({
        church_id: user.church_id,
        theme: theme.trim(),
        verses: verses.trim() || null,
        audio_url: audioUrl,
        audio_public_id: audioPublicId,
        sermon_date: new Date(date).toISOString(),
      });
      if (error) throw error;

      // Notifier les membres (DB + push)
      try {
        const ids = await allChurchMemberIds(user.church_id, user.id);
        if (ids.length) {
          await notify({
            recipients: ids,
            title: 'Nouvelle prédication',
            message: audioUrl
              ? `"${theme}" est disponible.`
              : `Une nouvelle prédication "${theme}" a été ajoutée.`,
            type: 'sermon',
            senderId: user.id,
            actorName: `${user.first_name} ${user.last_name}`,
            link: '/member/sermons',
          });
        }
      } catch {}

      toast.success('Prédication ajoutée');
      router.replace('/admin/sermons');
    } catch (e: any) {
      toast.error("Échec : " + e.message);
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <NavBar title="Nouvelle prédication" back />

      <div className="px-4 pt-2 pb-8 space-y-4">
        <IOSTextField
          label="Thème"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Ex: Le Bon Berger"
        />

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
            Versets associés
          </label>
          <textarea
            value={verses}
            onChange={(e) => setVerses(e.target.value)}
            placeholder="Ex: Jean 10 : 11-15"
            rows={3}
            className="w-full bg-white text-ios-label-light rounded-ios-lg p-4 outline-none text-[17px] resize-none border border-ios-gray5 placeholder:text-ios-gray2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 tracking-sf-tight"
          />
        </div>

        <IOSTextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
            Audio (MP3, optionnel)
          </label>
          {!audioFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 bg-ios-gray6 rounded-ios-lg border-2 border-dashed border-ios-gray3 text-ios-gray flex items-center justify-center gap-2 active:bg-ios-gray5"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[15px] font-medium">Choisir un fichier MP3</span>
            </button>
          ) : (
            <div className="bg-white rounded-ios-lg p-4 shadow-ios-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-ios bg-brand-50 flex items-center justify-center text-brand-600">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate">{audioFile.name}</p>
                <p className="text-[12px] text-ios-gray">
                  {(audioFile.size / 1024 / 1024).toFixed(1)} Mo
                </p>
              </div>
              <button
                onClick={() => setAudioFile(null)}
                className="p-2 text-ios-red active:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            // Pas de "audio/*" : sur Android PWA, ça route via le lecteur
            // Music qui JOUE le fichier au tap. Les extensions explicites
            // forcent le sélecteur Fichiers où le tap = sélection.
            accept=".mp3,.m4a,.aac,.wav,.ogg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const name = f.name.toLowerCase();
              const ok = ['.mp3', '.m4a', '.aac', '.wav', '.ogg'].some((ext) =>
                name.endsWith(ext)
              );
              if (!ok) {
                alert('Format audio non supporté. Choisissez un MP3, M4A, AAC, WAV ou OGG.');
                return;
              }
              setAudioFile(f);
            }}
          />
        </div>

        {saving && audioFile && (
          <div>
            <div className="flex justify-between text-[13px] text-ios-gray mb-1">
              <span>Téléchargement…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-ios-gray5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <IOSButton fullWidth size="lg" onClick={handleSubmit} isLoading={saving}>
          Enregistrer
        </IOSButton>
      </div>
    </div>
  );
}
