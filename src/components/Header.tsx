import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, Award } from "lucide-react";
import AuthModal from "./AuthModal";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  const openSignIn = () => {
    setAuthModalTab("signin");
    setAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const openSignUp = () => {
    setAuthModalTab("signup");
    setAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PaperShare</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Browse Papers
            </a>
            <a href="#upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Upload
            </a>
            <a href="#rewards" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Award className="h-4 w-4" />
              Rewards
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={openSignIn}>
              Sign In
            </Button>
            <Button variant="default" size="sm" onClick={openSignUp}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background animate-fade-in">
            <nav className="container py-4 flex flex-col gap-4">
              <a href="#browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Browse Papers
              </a>
              <a href="#upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Upload
              </a>
              <a href="#rewards" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-1">
                <Award className="h-4 w-4" />
                Rewards
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-center" onClick={openSignIn}>
                  Sign In
                </Button>
                <Button variant="default" className="w-full justify-center" onClick={openSignUp}>
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
        defaultTab={authModalTab}
      />
    </>
  );
};

export default Header;
