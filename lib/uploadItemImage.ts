import { supabase } from "./supabase-browser";
// export async function uploadItemImage(
//   stallId: string,
//   file: File,
// ): Promise<string> {
//   const path = `stall-${stallId}/${crypto.randomUUID()}-${file.name}`;
//   const { error } = await supabase.storage
//     .from("stall-items")
//     .upload(path, file, { contentType: file.type, cacheControl: "3600" });
//   if (error) throw error;

//   const { data } = await supabase.storage
//     .from("stall-items")
//     .createSignedUrl(path, 60 * 60 * 24 * 365);
//   return data.signedUrl;
// }

// // lib/uploadItemImage.ts
// import { supabase } from './supabase';

export async function uploadItemImage(stallId: string, file: File) {
  const path = `stall-${stallId}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage
    .from('stall-items')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
    });

  if (error) throw error;

  // const { data } = await supabase.storage
  //   .from('stall-items')
  //   .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    const { data, error: urlError } = await supabase.storage
    .from('stall-items')
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  
  if (urlError || !data) throw urlError ?? new Error('Could not sign URL');
  
  return data.signedUrl;}
