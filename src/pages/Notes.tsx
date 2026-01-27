import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FolderOpen } from "lucide-react";
import { NoteUpload } from "@/components/NoteUpload";
import BrowseNotes from "@/components/BrowseNotes";
import MyNotes from "@/components/MyNotes";

const Notes = () => {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Subject Notes</h1>
            <p className="text-muted-foreground">
              Browse and share study notes with fellow students
            </p>
          </div>
          <NoteUpload />
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="browse" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Notes
            </TabsTrigger>
            <TabsTrigger value="my-notes" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              My Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <BrowseNotes />
          </TabsContent>

          <TabsContent value="my-notes">
            <MyNotes />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Notes;
