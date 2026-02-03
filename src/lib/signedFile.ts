export async function openSignedFileInNewTab(signedUrl: string, opts?: { title?: string }) {
  // Open a blank tab synchronously (less likely to be blocked), then populate it after async fetch.
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    throw new Error("Popup blocked. Please allow popups for this site.");
  }

  try {
    win.document.title = opts?.title ? `Loading: ${opts.title}` : "Loading…";
    win.document.body.innerHTML = "<p style='font-family: system-ui, sans-serif; padding: 16px;'>Loading…</p>";

    const resp = await fetch(signedUrl);
    if (!resp.ok) {
      throw new Error(`Failed to load file (${resp.status})`);
    }

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Navigate the already-opened tab to a blob: URL (avoids navigating to blocked domains).
    win.location.href = blobUrl;

    // Revoke after a while; leaving it longer helps if user keeps the tab open.
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
  } catch (e) {
    // If something fails, show a message in the opened tab.
    const msg = e instanceof Error ? e.message : "Failed to open file";
    win.document.title = "Failed to open";
    win.document.body.innerHTML = `<p style='font-family: system-ui, sans-serif; padding: 16px;'>${msg}</p>`;
    throw e;
  }
}

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
