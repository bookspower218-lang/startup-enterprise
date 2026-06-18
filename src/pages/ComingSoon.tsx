import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Construction, ArrowLeft } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

interface Props {
  title: string;
  description: string;
}

const ComingSoon = ({ title, description }: Props) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container py-24 md:py-32">
        <Card className="mx-auto max-w-2xl p-10 text-center md:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Construction className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{description}</p>
          <Button asChild variant="accent" className="mt-8">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </Button>
        </Card>
      </section>
      <Footer />
    </div>
  );
};

export default ComingSoon;
