import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Zap, LayoutDashboard, FileText, Search, LogOut, User } from "lucide-react";
import { toast } from "sonner";

const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const isCompany = profile?.account_type === "company";

  const navItems = isCompany
    ? [
        { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/browse", label: "Browse Pitches", icon: Search },
        { to: "/profile", label: "Profile", icon: User },
      ]
    : [
        { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/pitches", label: "My Pitches", icon: FileText },
        { to: "/profile", label: "Profile", icon: User },
      ];

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-card/30 md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 border-b border-border/40 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">
            Pitch<span className="text-gold">Bridge</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border/40 p-4">
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="truncate font-medium text-foreground">{profile?.full_name || profile?.email}</div>
            <div className="capitalize">{profile?.account_type}</div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border/40 bg-card/30 px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">Pitch<span className="text-gold">Bridge</span></span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/40 bg-card/95 backdrop-blur md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`
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