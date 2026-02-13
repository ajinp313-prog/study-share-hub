

## Fix PDF Preview - Use embed tag instead of iframe

### Problem
The PDF preview modal fetches the PDF and creates a blob URL correctly, but the nested iframe inside Lovable's sandboxed preview environment cannot render the PDF inline. This causes either a blank page, a download prompt, or a Chrome security block.

### Solution
Replace the `<iframe>` with an `<embed>` element, which handles PDF rendering more reliably in sandboxed environments. Also add `#view=FitH` to the blob URL to hint the browser to display the PDF fitted to width.

Additionally, add a `DialogDescription` to fix the accessibility warning in the console.

### Changes

**File: `src/components/PDFPreviewModal.tsx`**
1. Import `DialogDescription` from the dialog UI component
2. Add a visually hidden `DialogDescription` for accessibility (fixes console warning)
3. Replace the `<iframe>` element with an `<embed>` element using `type="application/pdf"` and append `#view=FitH` to the blob URL
4. Since `<embed>` does not fire `onLoad` reliably, set `loading` to `false` immediately after the blob URL is created

### Technical Details

```text
Current:
  <iframe src={blobUrl} className="w-full h-full border-0" ... onLoad={() => setLoading(false)} />

Proposed:
  <embed src={`${blobUrl}#view=FitH`} type="application/pdf" className="w-full h-full" />
  (loading set to false right after setBlobUrl)
```

This approach:
- Avoids nested iframe sandboxing issues
- Uses the browser's native PDF plugin via embed
- Works in Chrome, Edge, and Firefox
- Properly cleans up blob URLs on close

