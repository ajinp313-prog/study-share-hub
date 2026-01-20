import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BrowsePapers from "@/components/BrowsePapers";
import RegistrationForm from "@/components/RegistrationForm";
import RewardsSection from "@/components/RewardsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <BrowsePapers />
        <RegistrationForm />
        <RewardsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
