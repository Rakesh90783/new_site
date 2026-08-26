# public/

Anything in this folder is served from the site root.

## Drop your resume here

Save your CV as **`resume.pdf`** in this folder. The "Download resume" buttons on
the home and About pages point at `/resume.pdf` (configured as `resumeUrl` in
`src/content/site.ts`).

If you would rather host it elsewhere — Google Drive, Dropbox, a signed S3 URL —
set `resumeUrl` to that full URL instead. Setting it to an empty string hides the
download buttons entirely.

## Favicon

Next.js picks up `src/app/icon.png` (or `icon.svg`) automatically if you add one.
Until then the browser default is used.

## Open Graph image

There is no static OG image to maintain — `src/app/opengraph-image.tsx` generates
one at request time from your name, title, and pitch.
