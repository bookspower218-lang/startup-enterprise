import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LayoutDashboard, FileText, Search, LogOut, User, MessageSquare, Shield, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";

const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const isCompany = profile?.account_type === "company";

  const baseItems = isCompany
    ? [
        { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/browse", label: "Discover", icon: Search },
        { to: "/chat", label: "Chats", icon: MessageSquare },
        { to: "/profile", label: "Profile", icon: User },
      ]
    : [
        { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/pitches", label: "My Pitches", icon: FileText },
        { to: "/chat", label: "Chats", icon: MessageSquare },
        { to: "/profile", label: "Profile", icon: User },
      ];
  const navItems = isAdmin
    ? [...baseItems, { to: "/admin/payments", label: "Admin", icon: Shield }]
    : baseItems;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold">
              Validate<span className="text-accent">PK</span>
            </span>
          </Link>
          <NotificationBell />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="truncate font-medium text-foreground">{profile?.full_name || profile?.email}</div>
            <div className="capitalize">{profile?.account_type}</div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mb-2 w-full justify-start">
            <Link to="/settings/account"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Validate<span className="text-accent">PK</span></span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default DashboardShell;
