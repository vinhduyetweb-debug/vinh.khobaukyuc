# KHOBAUKYUC V6.1 Family PWA Pro

## Summary

V6.1 adds a small PWA/offline app shell and mobile-focused family workflow polish while preserving the V5.6/V6.0 data safety guarantees.

## Added

- Local `service-worker.js` with versioned cache `khobaukyuc-v6.1.0`.
- PWA manifest update for Family PWA usage.
- Online/offline status text.
- Install app button and manual install guidance.
- Home actions focused on:
  - `Them ky uc hom nay`
  - `Xem kho ky uc`
  - `Backup / Bao ve du lieu`
- Quick Add reminder that Drive/YouTube links and advanced fields can be completed later.
- Backup center data safety reminder and quick access to Media Upload Queue.

## Intentionally Unchanged

- IndexedDB schema.
- Memory, Future Letter, profile, backup, import, export, manifest, checksum and Restore Preview formats.
- ZIP export structure.
- Local JSZip asset.
- Google Drive/YouTube link-only workflow.
- Static Vercel deployment model.

## PWA Safety Notes

- The service worker only caches same-origin app shell/static files.
- External Google Drive and YouTube URLs are not cached.
- Service worker registration is optional; if it fails, the app continues to use IndexedDB and existing backup/export flows.
- Browser storage is not a permanent archive. Users should keep JSON/ZIP backups and original media in Google Drive plus another backup location.

## Manual QA Checklist

- Open app from `index.html` through local HTTP.
- Confirm home actions scroll/open expected areas.
- Confirm online/offline status appears.
- Confirm service worker registers without blocking app startup.
- Confirm existing data still loads after refresh.
- Confirm Add/Edit/Delete memory still works.
- Confirm Suggested Filename V6.0.1 still appears.
- Confirm Future Letters still work.
- Confirm JSON export still includes manifest.
- Confirm ZIP export still opens and keeps existing structure.
- Confirm Restore Preview still appears on JSON import.
- Confirm no absolute paths were introduced.
