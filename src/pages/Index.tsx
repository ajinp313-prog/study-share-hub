import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BrowsePapers from "@/components/BrowsePapers";
import RegistrationForm from "@/components/RegistrationForm";
import RewardsSection from "@/components/RewardsSection";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        {!loading && user ? <BrowsePapers /> : null}
        <RegistrationForm />
        <RewardsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
