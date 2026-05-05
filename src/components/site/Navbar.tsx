import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Pitch<span className="text-gold">Bridge</span>
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
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <NavLink to="/company/register">For Companies</NavLink>
          </Button>
          <Button asChild variant="hero" size="sm">
            <NavLink to="/startup/register">Get Started</NavLink>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;