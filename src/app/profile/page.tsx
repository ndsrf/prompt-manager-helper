'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: user, isLoading } = trpc.user.me.useQuery(undefined, {
    enabled: !!session,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold cursor-pointer">PromptEasy</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Profile Settings</h2>
          <p className="text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600">
            {successMessage}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label>Subscription</Label>
                <div className="rounded-md border p-3">
                  <p className="font-medium capitalize">{user.subscriptionTier} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{user.subscriptionStatus}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
