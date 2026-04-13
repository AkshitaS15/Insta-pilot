import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  CheckCheck,
} from "lucide-react";
import { Notification, NotificationType } from "@/lib/types";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

function groupByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const d = new Date(n.createdAt);
    const key = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d, yyyy");
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

function notifIcon(type: string) {
  switch (type as NotificationType) {
    case "POST_PUBLISHED":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "POST_FAILED":
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case "PREVIEW_REQUIRED":
      return <Bell className="w-4 h-4 text-amber-400" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

function notifBg(type: string) {
  switch (type as NotificationType) {
    case "POST_PUBLISHED":
      return "bg-green-500/10 border-green-500/20";
    case "POST_FAILED":
      return "bg-red-500/10 border-red-500/20";
    case "PREVIEW_REQUIRED":
      return "bg-amber-500/10 border-amber-500/20";
    default:
      return "bg-blue-500/10 border-blue-500/20";
  }
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post("/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      toast.success("All notifications marked as read");
    },
  });

  const groups = groupByDate(notifications ?? []);
  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Notifications
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Stay updated on your campaign activity
            </p>
          </div>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {date}
                </p>
                <div className="space-y-2">
                  {items.map((n) => (
                    <button
                      key={n.id}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all hover:opacity-90",
                        !n.read ? notifBg(n.type) : "bg-card border-border"
                      )}
                      onClick={() => {
                        if (!n.read) markReadMutation.mutate(n.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            !n.read ? "bg-black/20" : "bg-secondary"
                          )}
                        >
                          {notifIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", !n.read ? "font-medium" : "text-muted-foreground")}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                            {n.contentItemId && (
                              <Link
                                to={`/preview/${n.contentItemId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-primary hover:underline"
                              >
                                View content
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up! Notifications will appear here when your posts are published or
              need review.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
