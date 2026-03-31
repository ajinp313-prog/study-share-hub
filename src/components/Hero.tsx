import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Award } from "lucide-react";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [stats, setStats] = useState({ papers: 0, students: 0, universities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      // Count approved papers
      const { count: papersCount } = await supabase
        .from("papers_public" as any)
        .select("*", { count: "exact", head: true });

      // Count approved notes
      const { count: notesCount } = await supabase
        .from("notes_public")
        .select("*", { count: "exact", head: true });

      // Count unique universities from papers
      const { data: paperUnis } = await supabase
        .from("papers_public" as any)
        .select("university")
        .not("university", "is", null);

      const { data: noteUnis } = await supabase
        .from("notes_public")
        .select("university")
        .not("university", "is", null);

      const allUnis = new Set<string>();
      ((paperUnis || []) as any[]).forEach((p: any) => { if (p.university) allUnis.add(p.university); });
      (noteUnis || []).forEach((n) => { if (n.university) allUnis.add(n.university); });

      setStats({
        papers: (papersCount || 0) + (notesCount || 0),
        students: 0, // We can't expose profile count publicly
        universities: allUnis.size,
      });
    };

    fetchStats();
  }, []);

  const formatCount = (n: number) => {
    if (n === 0) return "0";
    return String(n);
  };

  return (
    <>
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              100% Free for Students
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Share Knowledge,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Ace Your Exams
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Access question papers and study notes from high school to engineering. 
              Upload your materials, earn rewards, and help fellow students succeed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="gap-2" onClick={() => setAuthModalOpen(true)}>
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (user) {
                    navigate("/papers");
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
              >
                Browse Papers
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCount(stats.papers)}</p>
                <p className="text-sm text-muted-foreground">Resources</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCount(stats.universities)}</p>
                <p className="text-sm text-muted-foreground">Universities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
        defaultTab="signup"
      />
    </>
  );
};

export default Hero;
