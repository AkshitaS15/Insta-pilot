import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trash2,
  Zap,
  Loader2,
  Eye,
  Clock,
} from "lucide-react";
import {
  Campaign,
  ContentItem,
  Genre,
  GENRE_LABELS,
  GENRE_EMOJIS,
  FREQUENCY_LABELS,
  Frequency,
  STATUS_COLORS,
  ContentStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [generateGenre, setGenerateGenre] = useState<Genre | "">("");
  const [generatePostType, setGeneratePostType] = useState("");
  const [generateSource, setGenerateSource] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [generatedItem, setGeneratedItem] = useState<ContentItem | null>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => api.get<Campaign>(`/api/campaigns/${id}`),
    enabled: !!id,
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["content", { campaignId: id }],
    queryFn: () => api.get<ContentItem[]>(`/api/content?campaignId=${id}`),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/campaigns/${id}`),
    onSuccess: () => {
      toast.success("Campaign deleted");
      navigate("/campaigns");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<ContentItem>("/api/content/generate", {
        campaignId: id,
        genre: generateGenre,
        postType: generatePostType,
        contentSource: generateSource,
        uploadUrl: generateSource === "UPLOAD" ? uploadUrl : undefined,
      }),
    onSuccess: (data) => {
      setGeneratedItem(data);
      queryClient.invalidateQueries({ queryKey: ["content", { campaignId: id }] });
      toast.success("Content generated!");
    },
    onError: () => toast.error("Failed to generate content"),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Campaign not found.</p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/campaigns">Back to campaigns</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canGenerate =
    !!generateGenre && !!generatePostType && !!generateSource &&
    (generateSource !== "UPLOAD" || !!uploadUrl);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/campaigns">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {campaign.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                @{campaign.instagramAccount.username}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={cn(
                campaign.isActive
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/30"
              )}
            >
              {campaign.isActive ? "Active" : "Paused"}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{campaign.name}" and all its content. This cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Settings card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Campaign Settings
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Frequency</p>
              <p className="text-sm font-medium">
                {FREQUENCY_LABELS[campaign.frequency as Frequency] ?? campaign.frequency}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Post Time</p>
              <p className="text-sm font-medium">{campaign.postTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Post Types</p>
              <p className="text-sm font-medium">{campaign.postTypes.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Content Source</p>
              <p className="text-sm font-medium">{campaign.contentSource.join(", ")}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {campaign.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-400/20 border border-purple-500/30 text-purple-300"
                >
                  {GENRE_EMOJIS[g as Genre] ?? ""} {GENRE_LABELS[g as Genre] ?? g}
                </span>
              ))}
            </div>
          </div>
          {campaign.nextPostAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <Clock className="w-3.5 h-3.5" />
              Next post: {new Date(campaign.nextPostAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Generate content */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Generate Content
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Genre</Label>
              <Select
                value={generateGenre}
                onValueChange={(v) => setGenerateGenre(v as Genre)}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {campaign.genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {GENRE_EMOJIS[g as Genre] ?? ""} {GENRE_LABELS[g as Genre] ?? g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Post Type</Label>
              <Select value={generatePostType} onValueChange={setGeneratePostType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {campaign.postTypes.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Source</Label>
              <Select value={generateSource} onValueChange={setGenerateSource}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {campaign.contentSource.map((cs) => (
                    <SelectItem key={cs} value={cs}>
                      {cs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {generateSource === "UPLOAD" && (
            <div>
              <Label className="text-xs mb-1.5 block">Upload URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          )}
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!canGenerate || generateMutation.isPending}
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate Now
          </Button>

          {generatedItem && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                {generatedItem.imageUrl ? (
                  <img
                    src={generatedItem.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-400">Content generated!</p>
                <p className="text-xs text-muted-foreground truncate">{generatedItem.caption}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/preview/${generatedItem.id}`}>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Content queue */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Content Queue ({content?.length ?? 0})
          </h2>
          {contentLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : content && content.length > 0 ? (
            <div className="space-y-3">
              {content.map((item) => (
                <Link
                  key={item.id}
                  to={`/preview/${item.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.caption}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.postType} · {item.genre}
                      {item.scheduledAt && ` · ${new Date(item.scheduledAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium shrink-0",
                      STATUS_COLORS[item.status as ContentStatus]
                    )}
                  >
                    {item.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No content yet. Generate your first post above.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
