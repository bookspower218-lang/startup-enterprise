import { Link } from "react-router-dom";
import { Zap, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                Startup <span className="text-gold">Enterprise</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              The B2B startup validation marketplace. Real companies, real feedback.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/startup/register" className="hover:text-foreground">For Startups</Link></li>
              <li><Link to="/company/register" className="hover:text-foreground">For Companies</Link></li>
              <li><a href="/#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="/#how" className="hover:text-foreground">How it works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@startup-enterprise.pk</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Karachi, Pakistan</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Startup Enterprise. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;