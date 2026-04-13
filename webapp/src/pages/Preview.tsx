import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  Save,
  Trash2,
  Loader2,
  Instagram,
  AlertCircle,
} from "lucide-react";
import { ContentItem, GENRE_LABELS, Genre, STATUS_COLORS, ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["content", id],
    queryFn: () => api.get<ContentItem>(`/api/content/${id}`),
    enabled: !!id,
  });

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [dirty, setDirty] = useState(false);

  // Sync local state when data loads
  const initCaption = item?.caption ?? "";
  const initHashtags = item?.hashtags ?? "";

  const handleCaptionChange = (v: string) => {
    setCaption(v);
    setDirty(true);
  };
  const handleHashtagsChange = (v: string) => {
    setHashtags(v);
    setDirty(true);
  };

  const currentCaption = dirty ? caption : initCaption;
  const currentHashtags = dirty ? hashtags : initHashtags;

  const approveMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/content/${id}/approve`, {
        scheduledAt: scheduledAt || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", id] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content approved and scheduled!");
    },
    onError: () => toast.error("Failed to approve content"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/content/${id}`, {
        caption: currentCaption,
        hashtags: currentHashtags,
        scheduledAt: scheduledAt || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", id] });
      setDirty(false);
      toast.success("Changes saved!");
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/api/content/${id}/regenerate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", id] });
      setDirty(false);
      toast.success("Content regenerated!");
    },
    onError: () => toast.error("Failed to regenerate content"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/content/${id}`),
    onSuccess: () => {
      toast.success("Content deleted");
      navigate("/queue");
    },
    onError: () => toast.error("Failed to delete"),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-40 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Content not found.</p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/queue">Back to queue</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isPosted = item.status === "POSTED";
  const isFailed = item.status === "FAILED";
  const isAI = item.contentSource === "AI";

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Content Preview
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Image */}
          <div className="space-y-4">
            {/* Instagram-style frame */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              {/* Instagram header mock */}
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
                <div>
                  <p className="text-xs font-semibold">{item.campaignName}</p>
                  <p className="text-[10px] text-muted-foreground">Sponsored</p>
                </div>
                <div className="ml-auto text-muted-foreground text-lg leading-none">···</div>
              </div>

              {/* Image */}
              <div className="relative aspect-square bg-secondary">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    className="w-full h-full object-cover"
                  />
                ) : item.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-orange-900/50">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                    </div>
                    <p className="absolute bottom-4 text-white/60 text-sm">Reel</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Instagram className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Caption preview */}
              <div className="p-3">
                <p className="text-xs">
                  <span className="font-semibold">{item.campaignName}</span>{" "}
                  <span className="text-muted-foreground line-clamp-3">{currentCaption}</span>
                </p>
                {currentHashtags && (
                  <p className="text-xs text-primary mt-1 line-clamp-1">{currentHashtags}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs", STATUS_COLORS[item.status as ContentStatus])}
              >
                {item.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground">
                {item.postType}
              </Badge>
              <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground capitalize">
                {GENRE_LABELS[item.genre as Genre] ?? item.genre}
              </Badge>
              <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground">
                {item.contentSource}
              </Badge>
            </div>

            {/* Posted / Failed status */}
            {isPosted && item.postedAt && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-400">
                  Published on {new Date(item.postedAt).toLocaleString()}
                </p>
              </div>
            )}
            {isFailed && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">
                  Post failed. Please retry or regenerate content.
                </p>
              </div>
            )}

            {/* Caption editor */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Caption</Label>
              <Textarea
                value={currentCaption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                className="bg-secondary border-border resize-none min-h-[100px] text-sm"
                placeholder="Enter caption..."
              />
            </div>

            {/* Hashtags editor */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Hashtags</Label>
              <Textarea
                value={currentHashtags}
                onChange={(e) => handleHashtagsChange(e.target.value)}
                className="bg-secondary border-border resize-none min-h-[60px] text-sm text-primary"
                placeholder="#hashtag1 #hashtag2 ..."
              />
            </div>

            {/* Schedule */}
            {!isPosted && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Schedule (optional)</Label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            )}

            {/* Campaign info */}
            <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Campaign:</span> {item.campaignName}
              </p>
              {item.scheduledAt && (
                <p>
                  <span className="font-medium">Scheduled:</span>{" "}
                  {new Date(item.scheduledAt).toLocaleString()}
                </p>
              )}
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Action buttons */}
            {!isPosted && (
              <div className="space-y-2">
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-500 text-white border-0"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve &amp; Schedule
                </Button>

                {dirty && (
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                )}

                {isAI && (
                  <Button
                    onClick={() => regenerateMutation.mutate()}
                    disabled={regenerateMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {regenerateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                )}
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Content
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete content?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
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
      </div>
    </AppLayout>
  );
}
