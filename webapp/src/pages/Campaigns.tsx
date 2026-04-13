import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Zap, Eye } from "lucide-react";
import { Campaign, FREQUENCY_LABELS, Frequency, GENRE_LABELS, Genre } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.get<Campaign[]>("/api/campaigns"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/campaigns/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => {
      toast.error("Failed to update campaign");
    },
  });

  const filtered = campaigns?.filter((c) => {
    if (filter === "active") return c.isActive;
    if (filter === "paused") return !c.isActive;
    return true;
  }) ?? [];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Campaigns
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your Instagram posting campaigns
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90"
          >
            <Link to="/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">All ({campaigns?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({campaigns?.filter((c) => c.isActive).length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused ({campaigns?.filter((c) => !c.isActive).length ?? 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Campaigns grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onToggle={(isActive) =>
                  toggleMutation.mutate({ id: campaign.id, isActive })
                }
              />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {filter === "all"
                ? "Create your first campaign to start automating your Instagram posts."
                : `You don't have any ${filter} campaigns right now.`}
            </p>
            {filter === "all" && (
              <Button asChild>
                <Link to="/campaigns/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first campaign
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CampaignCard({
  campaign,
  onToggle,
}: {
  campaign: Campaign;
  onToggle: (active: boolean) => void;
}) {
  const displayGenres = campaign.genres.slice(0, 3);
  const extraGenres = campaign.genres.length - 3;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-primary/20 transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={campaign.instagramAccount.profilePicUrl ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-sm font-bold">
              {campaign.instagramAccount.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{campaign.name}</p>
            <p className="text-xs text-muted-foreground">@{campaign.instagramAccount.username}</p>
          </div>
        </div>
        <Switch
          checked={campaign.isActive}
          onCheckedChange={onToggle}
          className="shrink-0"
        />
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5">
        {displayGenres.map((genre) => (
          <span
            key={genre}
            className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-400/20 border border-purple-500/30 text-purple-300"
          >
            {GENRE_LABELS[genre as Genre] ?? genre}
          </span>
        ))}
        {extraGenres > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            +{extraGenres} more
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
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
        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
          {FREQUENCY_LABELS[campaign.frequency as Frequency] ?? campaign.frequency}
        </Badge>
        <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground">
          {campaign.postTypes.join(" + ")}
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {campaign.contentCount} posts
        </span>
      </div>

      {/* Action */}
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link to={`/campaigns/${campaign.id}`}>
          <Eye className="w-3.5 h-3.5 mr-2" />
          View Details
        </Link>
      </Button>
    </div>
  );
}
