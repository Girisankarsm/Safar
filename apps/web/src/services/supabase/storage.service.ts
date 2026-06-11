import { supabase } from "@/lib/supabase/client";

const MAX_WIDTH = 1280;
const QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : resolve(file)),
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export const storageService = {
  async uploadReportImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const compressed = await compressImage(file);
    const path = `${user.id}/${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from("report-images")
      .upload(path, compressed, { contentType: "image/webp", upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from("report-images").getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const compressed = await compressImage(file);
    const path = `${user.id}/avatar.webp`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, compressed, { contentType: "image/webp", upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },
};
