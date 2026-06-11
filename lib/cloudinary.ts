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
