

## Fix PDF Preview - Use PDF.js Canvas Rendering

### Problem
Both `<iframe>` and `<embed>` rely on the browser's native PDF plugin, which is blocked in the Lovable preview sandbox. This causes the PDF to show as a download prompt or an "Open" button instead of rendering inline.

### Solution
Use Mozilla's PDF.js library (loaded from CDN) to render PDF pages onto HTML `<canvas>` elements. This approach works everywhere because it's pure JavaScript - no browser plugins needed.

### Changes

**File: `src/components/PDFPreviewModal.tsx`** (full rewrite of the PDF rendering section)

1. Load the PDF.js library dynamically from CDN (`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs`)
2. Set the worker source to the CDN worker file
3. After fetching the PDF as a blob URL, use `pdfjsLib.getDocument()` to parse it
4. Render each page to a `<canvas>` element inside a scrollable container
5. Keep the existing blob fetch logic, loading states, error handling, and toolbar buttons

### How it works

```text
User clicks View
  -> Fetch PDF via signed URL -> Create blob
  -> PDF.js parses the blob
  -> Each page rendered to a <canvas> element
  -> Pages displayed in a scrollable container inside the modal
```

### Technical Details

- PDF.js is loaded once via dynamic `import()` from CDN - no npm package needed
- Each page is rendered at 1.5x scale for clarity
- Pages are stacked vertically in a scrollable `<div>` with `overflow-y: auto`
- The existing blob URL cleanup, error handling, and toolbar (Open in New Tab, Download, Close) remain unchanged
- The `DialogHeader` ref warning will also be fixed by wrapping it with `forwardRef` or restructuring the JSX

### Why previous approaches failed

| Approach | Why it failed |
|----------|--------------|
| `<iframe>` with blob URL | Sandbox blocks cross-origin navigation |
| `<iframe>` with signed URL | Supabase returns `Content-Disposition: attachment` |
| `<embed>` with blob URL | Browser PDF plugin blocked in sandbox |

Canvas rendering via PDF.js bypasses all of these restrictions since it's pure JavaScript.

