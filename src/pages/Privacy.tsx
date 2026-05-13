import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16">
      <Card className="mx-auto max-w-3xl p-8 md:p-12 prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Data we collect</h2>
        <p className="text-sm text-muted-foreground">We collect: account information (name, email, account type), profile details you provide (company name, industry, website, logo, bio, country, LinkedIn), pitch content you submit, messages you send to other users, payment references you submit for manual verification, and platform interaction metadata (timestamps, response decisions, ratings).</p>

        <h2 className="mt-6 text-xl font-semibold">2. How we use your data</h2>
        <p className="text-sm text-muted-foreground">To deliver the platform: route pitches to companies, enable Stage 3 conversations, verify payments, surface ratings and reputation, send transactional notifications about your pitches, and prevent abuse.</p>

        <h2 className="mt-6 text-xl font-semibold">3. Data retention</h2>
        <p className="text-sm text-muted-foreground">Active accounts: retained while your account is active. Closed pitches and message threads: kept for up to 24 months for dispute resolution. Payment records: retained for 7 years for tax/compliance. Audit logs: retained for 3 years. You may request hard deletion at any time from <code>/settings/account</code> — this purges all personal data and message history within 24 hours.</p>

        <h2 className="mt-6 text-xl font-semibold">4. Sharing</h2>
        <p className="text-sm text-muted-foreground">We do not sell personal data. Pitch content and identity are shared only with companies you target. Stage 4 contact details are shared with the other party once unlocked. We use Lovable Cloud (Supabase) for storage and Lovable Emails for transactional email delivery.</p>

        <h2 className="mt-6 text-xl font-semibold">5. Cookies</h2>
        <p className="text-sm text-muted-foreground">We use only essential cookies for session and preferences. You can decline analytics via the cookie banner.</p>

        <h2 className="mt-6 text-xl font-semibold">6. Your rights</h2>
        <p className="text-sm text-muted-foreground">Access, export (JSON), correct, or delete your data from <code>/settings/account</code>. For other requests, contact support@startup-enterprise.app.</p>

        <h2 className="mt-6 text-xl font-semibold">7. Contact</h2>
        <p className="text-sm text-muted-foreground">support@startup-enterprise.app</p>
      </Card>
    </section>
    <Footer />
  </div>
);

export default Privacy;