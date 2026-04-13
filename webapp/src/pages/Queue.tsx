import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Eye, Trash2, Check, Instagram, Clock } from "lucide-react";
import { ContentItem, STATUS_COLORS, ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_PREVIEW", label: "Pending Preview" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "POSTED", label: "Posted" },
  { value: "FAILED", label: "Failed" },
];

export default function Queue() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ["content", { status: statusFilter === "all" ? undefined : statusFilter }],
    queryFn: () =>
      api.get<ContentItem[]>(
        statusFilter === "all" ? "/api/content" : `/api/content?status=${statusFilter}`
      ),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/content/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content approved and scheduled!");
    },
    onError: () => toast.error("Failed to approve content"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            Content Queue
          </h1>
          <p className="text-muted-foreground text-sm mt-1">All your generated content across campaigns</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : content && content.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onApprove={() => approveMutation.mutate(item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
                approving={approveMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              No content{statusFilter !== "all" ? ` with status "${statusFilter}"` : " yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {statusFilter === "all"
                ? "Go to a campaign and generate some content to get started."
                : "Try selecting a different status filter."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ContentCard({
  item,
  onApprove,
  onDelete,
  approving,
}: {
  item: ContentItem;
  onApprove: () => void;
  onDelete: () => void;
  approving: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/20 transition-colors">
      {/* Image */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.caption}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : item.videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-orange-900/50">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Instagram className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full border font-medium backdrop-blur-sm",
              STATUS_COLORS[item.status as ContentStatus]
            )}
          >
            {item.status.replace("_", " ")}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-black/50 text-white border-white/20 backdrop-blur-sm">
            {item.postType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-primary mb-0.5">{item.campaignName}</p>
          <p className="text-sm text-foreground line-clamp-2">{item.caption}</p>
        </div>

        {(item.scheduledAt || item.postedAt) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {item.postedAt
              ? `Posted ${new Date(item.postedAt).toLocaleDateString()}`
              : item.scheduledAt
              ? `Scheduled ${new Date(item.scheduledAt).toLocaleDateString()}`
              : ""}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/preview/${item.id}`}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview
            </Link>
          </Button>

          {item.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={onApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-500 text-white border-0 flex-1"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete content?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this content item.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
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
  );
}
