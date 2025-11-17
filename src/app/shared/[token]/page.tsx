'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SharedPromptView } from "./SharedPromptView";
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';

interface PageProps {
  params: {
    token: string;
  };
}

export default function SharedPromptPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { token } = params;

  // Check share token info (works for unauthenticated users)
  const { data: shareInfo, isLoading: isCheckingShare } = trpc.share.checkShareToken.useQuery(
    { shareToken: token },
    { enabled: status !== 'loading' }
  );

  useEffect(() => {
    // If still loading session or share info, don't redirect yet
    if (status === 'loading' || isCheckingShare) {
      return;
    }

    // If user is unauthenticated
    if (status === 'unauthenticated') {
      // If share token is valid and prompt is public, redirect to gallery
      if (shareInfo?.found && shareInfo.isPublic && !shareInfo.isExpired && !shareInfo.isDeleted && shareInfo.promptId) {
        router.push(`/gallery?highlight=${shareInfo.promptId}`);
        return;
      }
      
      // Otherwise, require login
      router.push(`/auth/login?callbackUrl=/shared/${token}`);
    }
  }, [status, shareInfo, isCheckingShare, router, token]);

  if (status === 'loading' || isCheckingShare) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <SharedPromptView token={params.token} userId={session.user.id} />;
}
