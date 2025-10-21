'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SharedPromptView } from "./SharedPromptView";
import { useEffect } from 'react';

interface PageProps {
  params: {
    token: string;
  };
}

export default function SharedPromptPage({ params }: PageProps) {
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

  return <SharedPromptView token={params.token} userId={session.user.id} />;
}
