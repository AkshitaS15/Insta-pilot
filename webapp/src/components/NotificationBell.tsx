import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Notification } from "@/lib/types";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const count = countData?.count ?? 0;
  const recent = notifications?.slice(0, 5) ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            recent.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "w-full text-left p-3 hover:bg-secondary transition-colors",
                  !n.read && "bg-primary/5"
                )}
                onClick={() => !n.read && markRead.mutate(n.id)}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", n.read && "pl-4")}>
                    <p className="text-xs text-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                    {n.contentItemId && (
                      <Link
                        to={`/preview/${n.contentItemId}`}
                        className="text-[10px] text-primary hover:underline"
                      >
                        View content
                      </Link>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-border">
          <Link to="/notifications" className="text-xs text-primary hover:underline">
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
