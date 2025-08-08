import { v4 as uuid } from "uuid";
import { supabase } from "../supabaseclient";

export async function uploadAttachment(file: File) {
  const ext = file.name.split(".").pop();
  const path = `${uuid()}.${ext}`;
  const { error } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = await supabase.storage
    .from("message-attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return { url: data.signedUrl, size: file.size, type: file.type };
}
