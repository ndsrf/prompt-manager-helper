"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";
import {
  Share2,
  Link,
  Mail,
  Copy,
  Check,
  Trash2,
  Eye,
  Edit,
  Shield,
  Users,
  Globe,
  Lock
} from "lucide-react";

interface ShareDialogProps {
  promptId: string;
  promptTitle: string;
  currentPrivacy: "private" | "shared" | "public";
  trigger?: React.ReactNode;
}

export function ShareDialog({
  promptId,
  promptTitle,
  currentPrivacy,
  trigger
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [userEmails, setUserEmails] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");
  const [linkPermission, setLinkPermission] = useState<"view" | "edit">("view");
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: shares, isLoading: sharesLoading } = trpc.share.getPromptShares.useQuery(
    { promptId },
    { enabled: open }
  );

  // Mutations
  const shareWithUsers = trpc.share.shareWithUsers.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Prompt shared",
        description: `Shared with ${data.sharedCount} user(s)`,
      });
      if (data.notFoundEmails.length > 0) {
        toast({
          title: "Some users not found",
          description: `Could not find: ${data.notFoundEmails.join(", ")}`,
          variant: "destructive",
        });
      }
      setUserEmails("");
      void utils.share.getPromptShares.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to share",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateLink = trpc.share.generateShareLink.useMutation({
    onSuccess: (data) => {
      void navigator.clipboard.writeText(data.shareUrl);
      setCopiedToken(data.shareToken);
      setTimeout(() => setCopiedToken(null), 2000);
      toast({
        title: "Share link created",
        description: "Link copied to clipboard",
      });
      void utils.share.getPromptShares.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to create link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeShare = trpc.share.revokeShare.useMutation({
    onSuccess: () => {
      toast({
        title: "Access revoked",
      });
      void utils.share.getPromptShares.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to revoke",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePermission = trpc.share.updatePermission.useMutation({
    onSuccess: () => {
      toast({
        title: "Permission updated",
      });
      void utils.share.getPromptShares.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const makePublic = trpc.share.makePublic.useMutation({
    onSuccess: () => {
      toast({
        title: "Prompt is now public",
        description: "Anyone can view this prompt in the public gallery",
      });
      void utils.prompt.getById.invalidate({ id: promptId });
    },
  });

  const makePrivate = trpc.share.makePrivate.useMutation({
    onSuccess: () => {
      toast({
        title: "Prompt is now private",
        description: "All shares have been removed",
      });
      void utils.prompt.getById.invalidate({ id: promptId });
      void utils.share.getPromptShares.invalidate({ promptId });
    },
  });

  const handleShareWithUsers = () => {
    const emails = userEmails
      .split(/[,\n]/)
      .map((e: any) => e.trim())
      .filter((e: any) => e.length > 0);

    if (emails.length === 0) {
      toast({
        title: "No emails provided",
        variant: "destructive",
      });
      return;
    }

    shareWithUsers.mutate({
      promptId,
      userEmails: emails,
      permission,
    });
  };

  const handleGenerateLink = () => {
    generateLink.mutate({
      promptId,
      permission: linkPermission,
      expiresInDays,
    });
  };

  const handleCopyLink = (shareUrl: string, token: string) => {
    void navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: "Link copied",
    });
  };

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case "view":
        return <Eye className="h-4 w-4" />;
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPrivacyIcon = () => {
    switch (currentPrivacy) {
      case "public":
        return <Globe className="h-4 w-4" />;
      case "shared":
        return <Users className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{promptTitle}&rdquo;</DialogTitle>
          <DialogDescription>
            Share this prompt with others or make it public
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border p-3">
          {getPrivacyIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">Current privacy</p>
            <p className="text-xs text-muted-foreground capitalize">{currentPrivacy}</p>
          </div>
          <div className="flex gap-2">
            {currentPrivacy !== "public" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => makePublic.mutate({ promptId })}
                disabled={makePublic.isPending}
              >
                <Globe className="mr-2 h-4 w-4" />
                Make Public
              </Button>
            )}
            {currentPrivacy !== "private" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => makePrivate.mutate({ promptId })}
                disabled={makePrivate.isPending}
              >
                <Lock className="mr-2 h-4 w-4" />
                Make Private
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">
              <Mail className="mr-2 h-4 w-4" />
              Share with Users
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="mr-2 h-4 w-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email addresses</Label>
              <textarea
                id="emails"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter email addresses (one per line or comma-separated)"
                value={userEmails}
                onChange={(e) => setUserEmails(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission level</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Can edit
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin (full control)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleShareWithUsers}
              disabled={shareWithUsers.isPending || !userEmails.trim()}
              className="w-full"
            >
              Share with Users
            </Button>

            {!sharesLoading && shares && shares.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">People with access</h4>
                  <div className="space-y-2">
                    {shares
                      .filter((share: any) => !share.isLinkShare)
                      .map((share: any) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              {share.sharedWith?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {share.sharedWith?.name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {share.sharedWith?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              {getPermissionIcon(share.permission)}
                              {share.permission}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeShare.mutate({ shareId: share.id })}
                              disabled={revokeShare.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkPermission">Permission level</Label>
              <Select
                value={linkPermission}
                onValueChange={(v) => setLinkPermission(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Can edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires in (days)</Label>
              <Select
                value={expiresInDays.toString()}
                onValueChange={(v) => setExpiresInDays(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateLink}
              disabled={generateLink.isPending}
              className="w-full"
            >
              <Link className="mr-2 h-4 w-4" />
              Generate Share Link
            </Button>

            {!sharesLoading && shares && shares.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Active share links</h4>
                  <div className="space-y-2">
                    {shares
                      .filter((share: any) => share.isLinkShare)
                      .map((share: any) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                {getPermissionIcon(share.permission)}
                                {share.permission}
                              </Badge>
                              {share.expiresAt && (
                                <span className="text-xs text-muted-foreground">
                                  Expires {new Date(share.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {share.shareUrl}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(share.shareUrl!, share.shareToken!)}
                            >
                              {copiedToken === share.shareToken ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeShare.mutate({ shareId: share.id })}
                              disabled={revokeShare.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
