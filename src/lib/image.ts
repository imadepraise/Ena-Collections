// Shrinks big phone photos so uploads are quick and free storage lasts longer.
export async function compressImage(file: File, max = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    return blob && blob.size < file.size ? new File([blob], 'photo.webp', { type: 'image/webp' }) : file;
  } catch {
    return file;
  }
}
