import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Instagram, AlertCircle, Trash2, ExternalLink, Shield, BookCheck, Unplug, CheckCircle2, Settings2 } from "lucide-react";
import { InstagramAccount } from "@/lib/types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Connect() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (window.opener) {
      // We're in the OAuth popup — communicate result back to opener and close
      if (success === "true") {
        window.opener.postMessage({ type: "instagram-oauth-success" }, "*");
      } else if (error) {
        window.opener.postMessage({ type: "instagram-oauth-error", error: decodeURIComponent(error) }, "*");
      }
      if (success || error) {
        window.close();
        return;
      }
    } else {
      // Normal page load (not in popup)
      if (success === "true") {
        toast.success("Instagram account connected successfully!");
      }
      if (error) {
        toast.error(decodeURIComponent(error));
      }
    }
  }, [searchParams]);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["instagram-status"],
    queryFn: () => api.get<{ configured: boolean }>("/api/instagram/status"),
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["instagram-accounts"],
    queryFn: () => api.get<InstagramAccount[]>("/api/instagram/accounts"),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/instagram/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-accounts"] });
      toast.success("Account disconnected.");
    },
    onError: () => {
      toast.error("Failed to disconnect account.");
    },
  });

  const handleConnect = () => {
    const url = `${BACKEND_URL}/api/instagram/auth`;
    const popup = window.open(url, "instagram-oauth", "width=600,height=700,scrollbars=yes,resizable=yes");
    if (!popup) {
      // Fallback if popup blocked
      window.location.href = url;
      return;
    }
    // Listen for message from popup when OAuth completes
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "instagram-oauth-success") {
        toast.success("Instagram account connected successfully!");
        queryClient.invalidateQueries({ queryKey: ["instagram-accounts"] });
        window.removeEventListener("message", handler);
      } else if (event.data?.type === "instagram-oauth-error") {
        toast.error(event.data.error || "Failed to connect Instagram.");
        window.removeEventListener("message", handler);
      }
    };
    window.addEventListener("message", handler);
  };

  const configured = statusData?.configured ?? false;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Connect Instagram
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Link your Instagram Business or Creator accounts to start automating posts.
          </p>
        </div>

        {/* Status badge */}
        {statusLoading ? (
          <Skeleton className="h-8 w-36 rounded-full" />
        ) : configured ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Service Active
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Setup Required
          </div>
        )}

        {/* Admin setup card — shown only when NOT configured */}
        {!statusLoading && !configured && (
          <div className="bg-card border border-amber-500/30 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Settings2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-amber-300 mb-1">Service Setup Required</h2>
                <p className="text-sm text-muted-foreground">
                  Instagram posting is not yet active. As the service owner, you need to configure your Meta Developer App credentials.
                </p>
              </div>
            </div>

            <ol className="space-y-3 pl-1">
              {[
                <>Create a Meta Developer account at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline text-amber-400/80 hover:text-amber-300">developers.facebook.com</a></>,
                "Create a new Meta App, then add the Instagram product to it.",
                <>Request permissions: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">instagram_basic</code>, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">instagram_content_publish</code>, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">pages_read_engagement</code>, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">pages_show_list</code></>,
                "Copy your App ID and App Secret from the app dashboard.",
                <>Add to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">backend/.env</code>: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_ID=your_id</code> and <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_SECRET=your_secret</code></>,
                "Submit for Meta App Review to allow all users to connect (takes approx. 1-2 weeks).",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>

            <div className="bg-muted/40 border border-border rounded-lg p-3 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Connect your test account first.</span> During development, add yourself as a test user in Meta App Dashboard → Roles → Test Users.
              </p>
            </div>
          </div>
        )}

        {/* Before you connect — shown only when configured */}
        {!statusLoading && configured && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Before you connect</h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium">Have an Instagram Business or Creator account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Personal accounts don't support scheduling. Switch to Business or Creator in Instagram Settings → Account → Account Type.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium">Link your Instagram to a Facebook Page</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to Instagram Settings → Account → Linked accounts → Connect to Facebook.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium">That's it! We handle the rest securely.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Just click the button below and follow the prompts on Instagram / Facebook.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* How it works cards — shown only when configured */}
        {!statusLoading && configured && (
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: <Shield className="w-4 h-4 text-purple-400" />,
                  title: "Secure OAuth",
                  desc: "You log in directly on Instagram/Facebook. We never see your password.",
                },
                {
                  icon: <BookCheck className="w-4 h-4 text-pink-400" />,
                  title: "One-time setup",
                  desc: "Authorize once and InstaFlow manages your posting from there.",
                },
                {
                  icon: <Unplug className="w-4 h-4 text-orange-400" />,
                  title: "Revoke anytime",
                  desc: "Disconnect your account at any time from Instagram settings.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect button — only when configured */}
        {!statusLoading && configured && (
          <button
            onClick={handleConnect}
            className="w-full p-5 rounded-xl border-2 border-dashed border-purple-500/40 bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-orange-400/10 hover:from-purple-600/20 hover:via-pink-500/20 hover:to-orange-400/20 transition-all group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Connect Instagram Account
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be redirected to Instagram / Facebook to authorize
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                Opens in browser
              </div>
            </div>
          </button>
        )}

        {/* Connected accounts */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Connected Accounts
          </h2>

          {accountsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={account.profilePicUrl ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white font-bold">
                      {account.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">@{account.username}</p>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    {account.pageName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{account.pageName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect @{account.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the account and stop all associated campaigns from posting.
                          You can reconnect later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => disconnectMutation.mutate(account.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
              <Instagram className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No accounts connected yet</p>
              <p className="text-sm text-muted-foreground">
                {configured
                  ? "Click the button above to connect your first Instagram account."
                  : "Complete the service setup above to enable account connections."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
