import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Validate<span className="text-accent">PK</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { to: "/#features", label: "Features" },
            { to: "/#how", label: "How It Works" },
            { to: "/#pricing", label: "Pricing" },
            { to: "/#enterprises", label: "Enterprises" },
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
              <Button asChild size="sm">
                <NavLink to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</NavLink>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <NavLink to="/login">Sign in</NavLink>
              </Button>
              <Button asChild size="sm">
                <NavLink to="/register">Apply Now</NavLink>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
