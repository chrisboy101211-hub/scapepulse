import { supabase } from "@/lib/supabase"

export const TOPLIST_ICON_BUCKET = "toplist-icons"
export const TOPLIST_BANNER_BUCKET = "toplist-banners"

const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export async function uploadToplistImage(file: File, userId: string, kind: "icon" | "banner"): Promise<string> {
  const extension = ACCEPTED_TYPES[file.type]
  if (!extension) throw new Error("Upload a PNG, JPG, WebP, or GIF image.")

  const sizeLimit = kind === "icon" ? 2 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.size > sizeLimit) throw new Error(`${kind === "icon" ? "Icons" : "Banners"} must be smaller than ${sizeLimit / 1024 / 1024}MB.`)

  const bucket = kind === "icon" ? TOPLIST_ICON_BUCKET : TOPLIST_BANNER_BUCKET
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
