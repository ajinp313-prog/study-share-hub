import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RegistrationForm from "@/components/RegistrationForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <RegistrationForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
