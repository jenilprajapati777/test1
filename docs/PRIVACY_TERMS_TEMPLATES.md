# Privacy & Terms of Service Documentation — Museum of Us

This document outlines the privacy commitments, data handling practices, and terms of service for **Museum of Us**.

---

## 1. Privacy Policy Architecture

Museum of Us is created for personal, intimate gifts. Privacy is built into the architecture:

### 1.1 Automatic EXIF & GPS Metadata Stripping

Before any uploaded photo leaves the user's device (in both Demo and Live modes):

- The image file is transcoded client-side using an HTML5 Canvas into WebP format (`max(width, height) <= 2048px`, quality ~0.82).
- This process completely and irreversibly strips all Exchangeable Image File (EXIF) metadata, including **GPS coordinates**, camera hardware serial numbers, timestamps, and orientation tags.

### 1.2 Zero Tracking & Zero Advertisements

- The application contains **zero third-party tracking pixels, analytics beacons, or behavioral advertising cookies**.
- We do not sell, rent, or monetize personal data or uploaded media.

### 1.3 Private & Unlisted Exhibition Rooms

- Museum rooms (`/m/:slug`) are unlisted and are not indexed by search engines.
- The `public/_headers` configuration enforces:
  ```http
  /m/*
    X-Robots-Tag: noindex, nofollow, noarchive
  ```
- Museums are accessible only to individuals who possess the unique link or QR code.

### 1.4 Data Deletion & Creator Control

- Creators retain full ownership of their content.
- At any time via `/dashboard`, creators can:
  - **Unpublish:** Instantly revoke public access while preserving personal records.
  - **Delete:** Permanently and irreversibly delete the museum, all hosted photos, plaque inscriptions, and guestbook replies from both the database and cloud storage.

---

## 2. Terms of Service

### 2.1 Acceptable Use

Museum of Us is intended for romantic tributes, anniversaries, friendships, memorials, and celebratory milestones. Users agree NOT to upload:

- Content that infringes copyright, trademark, or intellectual property rights.
- Explicit non-consensual imagery, harassment, threats, or hate speech.
- Malicious scripts or unauthorized automated scraping tools.

### 2.2 Content Reporting & Moderation

- Every room includes a discreet **Report** flow accessible from the museum HUD menu.
- Visitors can flag inappropriate content or request takedowns.
- Flagged rooms undergo immediate administrative review and automated hiding if reports meet severity thresholds.

### 2.3 DMCA & Takedown Requests

If you believe content hosted on a live instance of Museum of Us infringes your intellectual property, contact the site administrator with:

1. Identification of the copyrighted work.
2. The specific URL (`/m/:slug`) of the alleged infringement.
3. Your contact information and physical or electronic signature.
   Takedown requests are processed within 24 business hours.
