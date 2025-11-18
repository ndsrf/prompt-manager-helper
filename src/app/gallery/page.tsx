'use client';

import { Suspense } from 'react';
import { PublicGalleryClient } from "./PublicGalleryClient";

function GalleryContent() {
  return <PublicGalleryClient />;
}

export default function PublicGalleryPage() {
  // Gallery is now accessible to everyone (authenticated and unauthenticated)
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading gallery...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
