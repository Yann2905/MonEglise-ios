const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const IMAGE_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_PRESET!;

export interface CloudinaryImageResult {
  url: string;
  publicId: string;
}

/** Upload une image vers Cloudinary (preset unsigned) */
export function uploadImage(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<CloudinaryImageResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', IMAGE_PRESET);
    form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
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
}

/**
 * Transforme une URL Cloudinary pour récupérer une version optimisée
 * (taille, qualité auto, format auto webp/avif si supporté).
 *
 * Ex: cldUrl(url, { w: 88, h: 88, face: true })
 * → https://res.cloudinary.com/.../upload/w_88,h_88,c_fill,g_face,f_auto,q_auto/...
 *
 * Gain : un avatar 88×88 fait ~5 KB au lieu de l'image originale de ~200 KB.
 */
export function cldUrl(
  url: string | null | undefined,
  opts: { w?: number; h?: number; face?: boolean } = {}
): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  const transforms: string[] = [];
  if (opts.w) transforms.push(`w_${opts.w}`);
  if (opts.h) transforms.push(`h_${opts.h}`);
  if (opts.w || opts.h) transforms.push('c_fill');
  if (opts.face) transforms.push('g_face');
  transforms.push('f_auto', 'q_auto');
  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
}

/**
 * Optimise une URL audio Cloudinary à la volée.
 *
 * Cloudinary route les audios via /video/upload/ (convention interne).
 * On compresse à 64 kbps AAC mono — qualité parfaite pour la parole
 * (prédications), 5× plus petit qu'un MP3 320 kbps original.
 *
 * Stratégies disponibles :
 *  - 'speech' (défaut) : 64 kbps AAC mono — parole humaine, ~5× plus léger
 *  - 'music'           : 96 kbps AAC stéréo — meilleur pour louange/chant
 *  - 'original'        : aucune transformation — fichier brut
 */
export function cldAudioUrl(
  url: string | null | undefined,
  preset: 'speech' | 'music' | 'original' = 'speech'
): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com')) return url;
  if (preset === 'original') return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  const transforms = preset === 'music'
    ? 'br_96k,ac_aac,f_m4a' // 96 kbps stéréo
    : 'br_64k,ac_aac,f_m4a,e_volume:auto'; // 64 kbps mono + normalisation
  return `${parts[0]}/upload/${transforms}/${parts[1]}`;
}

/**
 * Upload un fichier brut (PDF, etc.) vers Cloudinary.
 * Utilise le même preset image en mode raw_upload.
 */
export function uploadRaw(
  file: Blob,
  folder: string,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<CloudinaryImageResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, filename);
    form.append('upload_preset', IMAGE_PRESET);
    form.append('folder', folder);
    form.append('public_id', filename.replace(/\.[^.]+$/, ''));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const r = JSON.parse(xhr.responseText);
        resolve({ url: r.secure_url, publicId: r.public_id });
      } else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}

/** Supprime une ressource Cloudinary via l'Edge Function */
export async function destroyCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image') {
  const { supabase } = await import('./supabase');
  try {
    await supabase.functions.invoke('delete-cloudinary', {
      body: { public_id: publicId, resource_type: resourceType },
    });
  } catch (e) {
    console.warn('delete-cloudinary failed', e);
  }
}
