'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import Image from 'next/image';
import { ExtensionTokens } from '@/components/settings/ExtensionTokens';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: user, isLoading } = trpc.user.me.useQuery(undefined, {
    enabled: !!session,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setSuccessMessage('');
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setCustomInstructions(user.customInstructions || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: name || undefined,
      username: username || null,
      bio: bio || null,
      customInstructions: customInstructions || null,
      avatarUrl: avatarUrl || null,
    });
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

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-500/15 p-3 text-sm text-red-600">
            {errorMessage}
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
                <Label htmlFor="avatar">Avatar</Label>
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <div className="relative h-16 w-16 rounded-full border-2 border-border overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <span className="text-2xl text-muted-foreground">
                        {name ? name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter an image URL for your avatar
                    </p>
                  </div>
                </div>
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  pattern="[a-zA-Z0-9_-]+"
                  minLength={3}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, underscores, and hyphens only (3-30 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add details you want the AI to know about you and specify how you'd like it to format its responses..."
                  maxLength={2000}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {customInstructions.length}/2000 characters - These instructions will be used to personalize AI responses
                </p>
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

        {/* Extension Tokens Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Chrome Extension</CardTitle>
            <CardDescription>
              Manage tokens for connecting the Chrome extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExtensionTokens />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
