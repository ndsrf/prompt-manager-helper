'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PublicGalleryClient } from "./PublicGalleryClient";
import { useEffect } from 'react';

export default function PublicGalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <PublicGalleryClient />;
}
