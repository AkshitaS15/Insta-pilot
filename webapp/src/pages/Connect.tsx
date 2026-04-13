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
import { Instagram, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import { InstagramAccount } from "@/lib/types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Connect() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Instagram account connected successfully!");
    }
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  const { data: accounts, isLoading } = useQuery({
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
    window.location.href = `${BACKEND_URL}/api/instagram/auth`;
  };

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

        {/* Demo mode banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Demo Mode</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Instagram API credentials may not be configured. Add{" "}
              <code className="font-mono bg-amber-500/20 px-1 rounded">INSTAGRAM_APP_ID</code> and{" "}
              <code className="font-mono bg-amber-500/20 px-1 rounded">INSTAGRAM_APP_SECRET</code> to
              your backend .env to enable real posting.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Before you connect</h2>
          <ol className="space-y-3">
            {[
              "You need an Instagram Business or Creator account.",
              "Your Instagram must be connected to a Facebook Page.",
              "A Meta Developer App (App ID & Secret) must be configured in the backend.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Connect button */}
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

        {/* Connected accounts */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Connected Accounts
          </h2>

          {isLoading ? (
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
                Click the button above to connect your first Instagram account.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
