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
import { ThemeSelector } from '@/components/settings/ThemeSelector';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              PromptEasy
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-white/5 hover:bg-white/10 text-white border-white/10">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto p-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Profile Settings</h2>
          <p className="text-gray-400 mt-2">
            Manage your account information
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
            <CardDescription className="text-gray-400">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-white/5 border-white/10 text-gray-400"
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-gray-300">Avatar</Label>
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <div className="relative h-16 w-16 rounded-full border-2 border-purple-500/30 overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-500/30">
                      <span className="text-2xl text-white">
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter an image URL for your avatar
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  pattern="[a-zA-Z0-9_-]+"
                  minLength={3}
                  maxLength={30}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  Letters, numbers, underscores, and hyphens only (3-30 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  {bio.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customInstructions" className="text-gray-300">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add details you want the AI to know about you and specify how you'd like it to format its responses..."
                  maxLength={2000}
                  rows={5}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  {customInstructions.length}/2000 characters - These instructions will be used to personalize AI responses
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Subscription</Label>
                <div className="rounded-lg bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 p-3">
                  <p className="font-medium capitalize text-white">{user.subscriptionTier} Plan</p>
                  <p className="text-sm text-gray-400">
                    Status: <span className="capitalize">{user.subscriptionStatus}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Member Since</Label>
                <p className="text-sm text-gray-400">
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
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <div className="mt-6">
          <ThemeSelector />
        </div>

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
