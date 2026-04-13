import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Instagram,
  Zap,
  Clock,
  CheckCircle,
  Link as LinkIcon,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Campaign, ContentItem, InstagramAccount, STATUS_COLORS, ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function getGreeting(email: string) {
  const hour = new Date().getHours();
  const name = email.split("@")[0];
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["instagram-accounts"],
    queryFn: () => api.get<InstagramAccount[]>("/api/instagram/accounts"),
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.get<Campaign[]>("/api/campaigns"),
  });

  const { data: allContent, isLoading: contentLoading } = useQuery({
    queryKey: ["content", {}],
    queryFn: () => api.get<ContentItem[]>("/api/content"),
  });

  const tickMutation = useMutation({
    mutationFn: () => api.post("/api/publish/tick"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  useEffect(() => {
    tickMutation.mutate();
  }, []);

  const activeCampaigns = campaigns?.filter((c) => c.isActive) ?? [];
  const scheduledContent = allContent?.filter((c) => c.status === "SCHEDULED") ?? [];
  const postedContent = allContent?.filter((c) => c.status === "POSTED") ?? [];
  const recentContent = allContent?.slice(0, 5) ?? [];
  const recentCampaigns = campaigns?.slice(0, 3) ?? [];

  const stats = [
    {
      label: "Connected Accounts",
      value: accounts?.length ?? 0,
      icon: LinkIcon,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Active Campaigns",
      value: activeCampaigns.length,
      icon: Zap,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      label: "Posts Scheduled",
      value: scheduledContent.length,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Posts Published",
      value: postedContent.length,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {getGreeting(session?.user?.email ?? "there")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here's what's happening with your Instagram accounts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/connect">
                <LinkIcon className="w-4 h-4 mr-1.5" />
                Connect
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90"
            >
              <Link to="/campaigns/new">
                <Plus className="w-4 h-4 mr-1.5" />
                New Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl p-4 md:p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stat.bg)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                {accountsLoading || campaignsLoading || contentLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p
                    className="text-3xl font-bold"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connected Accounts */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Connected Accounts
              </h2>
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link to="/connect">Manage</Link>
              </Button>
            </div>
            {accountsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={account.profilePicUrl ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-sm font-bold">
                        {account.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">@{account.username}</p>
                      {account.pageName && (
                        <p className="text-xs text-muted-foreground truncate">{account.pageName}</p>
                      )}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-6 text-center">
                <Instagram className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No accounts connected</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Connect your Instagram to get started
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/connect">Connect Instagram</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Active Campaigns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Active Campaigns
              </h2>
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link to="/campaigns">View all</Link>
              </Button>
            </div>
            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaigns/${campaign.id}`}
                    className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={campaign.instagramAccount.profilePicUrl ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs">
                            {campaign.instagramAccount.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{campaign.instagramAccount.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            campaign.isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                          )}
                        >
                          {campaign.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{campaign.contentCount} posts</span>
                      <span>{campaign.frequency}</span>
                      {campaign.genres.slice(0, 2).map((g) => (
                        <span key={g} className="capitalize">
                          {g}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-6 text-center">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No campaigns yet</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Create your first campaign to start posting
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/campaigns/new">Create Campaign</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        {recentContent.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Recent Content
              </h2>
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link to="/queue">View queue</Link>
              </Button>
            </div>
            {contentLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {recentContent.map((item) => (
                  <Link
                    key={item.id}
                    to={`/preview/${item.id}`}
                    className="group relative aspect-square bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-orange-900/50">
                        <Instagram className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                          STATUS_COLORS[item.status as ContentStatus]
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
