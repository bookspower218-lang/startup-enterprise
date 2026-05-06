import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Startup <span className="text-gold">Enterprise</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { to: "/#how", label: "How it works" },
            { to: "/#industries", label: "Industries" },
            { to: "/#pricing", label: "Pricing" },
            { to: "/#faq", label: "FAQ" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <Button asChild variant="hero" size="sm">
                <NavLink to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</NavLink>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <NavLink to="/login">Sign in</NavLink>
              </Button>
              <Button asChild variant="hero" size="sm">
                <NavLink to="/startup/register">Get Started</NavLink>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;