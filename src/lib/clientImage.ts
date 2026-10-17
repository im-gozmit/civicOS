// Browser-side helpers for uploading photos. The hosting platform rejects any request larger than
// about 4.5 MB, and a phone camera photo is often bigger than that, so photos are shrunk before
// they are sent.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stay safely under the hosting limit

/** Shrinks a photo to at most `maxSide` pixels on its longest side and re-saves it as a JPEG. */
export async function downscaleImage(file: File, maxSide = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // e.g. a format this browser cannot read: the server still checks what it receives
  }
}

/** A plain-language message for an upload that failed, including the "file too large" case. */
export function uploadErrorMessage(status: number, serverMessage?: string): string {
  if (status === 413) return "The photo is too large to upload. Please choose a smaller photo or take a new one.";
  return serverMessage ?? "Upload failed. Please try again.";
}
