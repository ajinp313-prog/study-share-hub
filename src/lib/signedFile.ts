export async function downloadSignedFile(signedUrl: string, filename: string) {
  const resp = await fetch(signedUrl);
  if (!resp.ok) {
    throw new Error(`Failed to download file (${resp.status})`);
  }
  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

