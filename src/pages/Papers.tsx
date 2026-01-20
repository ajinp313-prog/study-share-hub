import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrowsePapers from "@/components/BrowsePapers";
import MyUploads from "@/components/MyUploads";
import { PaperUpload } from "@/components/PaperUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload } from "lucide-react";

const Papers = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Papers Library</h1>
          <p className="text-muted-foreground">
            Browse question papers or manage your uploads
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Papers
              </TabsTrigger>
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                My Uploads
              </TabsTrigger>
            </TabsList>
            
            <PaperUpload />
          </div>

          <TabsContent value="browse" className="mt-0">
            <BrowsePapers />
          </TabsContent>

          <TabsContent value="uploads" className="mt-0">
            <MyUploads />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Papers;
