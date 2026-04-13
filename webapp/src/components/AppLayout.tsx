import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, Home, Zap, Clock, Link, LogOut, Instagram } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/campaigns", label: "Campaigns", icon: Zap },
  { path: "/queue", label: "Queue", icon: Clock },
  { path: "/connect", label: "Connect", icon: Link },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-[10px] font-bold flex items-center justify-center px-1">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: 30000,
    enabled: !!session,
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    navigate("/auth");
    return null;
  }

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/auth");
  };

  const count = unreadCount?.count ?? 0;
  const email = session.user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 bg-card border-r border-border z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <RouterLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent" style={{ fontFamily: "Syne, sans-serif" }}>
              InstaFlow
            </span>
          </RouterLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            const isNotif = item.path === "/notifications";
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {isNotif && <NotificationBadge count={count} />}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
                {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />}
              </RouterLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{email}</p>
              <p className="text-xs text-muted-foreground">Account</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 mt-1 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs">Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 px-2 pb-safe">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.filter((i) => i.path !== "/connect").map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            const isNotif = item.path === "/notifications";
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-4 relative transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isNotif && <NotificationBadge count={count} />}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </RouterLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
