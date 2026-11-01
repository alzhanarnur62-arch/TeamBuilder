import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';

/** base64 → байттар (Supabase Storage ArrayBuffer қабылдайды). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Фотоны 512 px-ке дейін кішірейтіп (≈50–100 КБ), Supabase Storage-ке жүктейді
 * және бәрі көре алатын сілтемені қайтарады.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(localUri).resize({ width: 512 }).renderAsync();
  const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  if (!image.base64) throw new Error('Could not read the image');

  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, base64ToBytes(image.base64).buffer as ArrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Сілтеме өзгермейді, сондықтан ескі фото кэштен шықпауы үшін нұсқа белгісін қосамыз.
  return `${data.publicUrl}?v=${Date.now()}`;
}
