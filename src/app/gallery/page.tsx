'use client';

import { PublicGalleryClient } from "./PublicGalleryClient";

export default function PublicGalleryPage() {
  // Gallery is now accessible to everyone (authenticated and unauthenticated)
  return <PublicGalleryClient />;
}
