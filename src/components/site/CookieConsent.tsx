import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const KEY = "cookie_consent";

export const hasCookieConsent = () => typeof window !== "undefined" && localStorage.getItem(KEY) === "accepted";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem(KEY);
    if (!v) setShow(true);
  }, []);

  if (!show) return null;

  const set = (v: "accepted" | "declined") => {
    localStorage.setItem(KEY, v);
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-card">
      <div className="container flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
        <Cookie className="h-5 w-5 shrink-0 text-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          We use essential cookies to run the platform and optional analytics to improve it. See our{" "}
          <Link to="/privacy" className="text-foreground underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => set("declined")}>Decline</Button>
          <Button size="sm" onClick={() => set("accepted")}>Accept</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;