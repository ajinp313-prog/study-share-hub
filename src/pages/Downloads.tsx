import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { downloadSignedFile } from "@/lib/signedFile";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { FileText, StickyNote, Download, Calendar, BookOpen, GraduationCap, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadRecord {
  id: string;
  item_id: string;
  item_type: string;
  item_title: string;
  item_subject: string;
  item_level: string;
  created_at: string;
}

const Downloads = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const { getSignedUrl, loading: signingUrl } = useSignedUrl();
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("download_history")
        .select("id, item_id, item_type, item_title, item_subject, item_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setDownloads((data as DownloadRecord[]) || []);
      setFetching(false);
    };

    fetchDownloads();
  }, [user]);

  const getFilePath = async (dl: DownloadRecord): Promise<string | null> => {
    const table = dl.item_type === "paper" ? "papers" : "notes";
    const { data } = await supabase
      .from(table)
      .select("file_path")
      .eq("id", dl.item_id)
      .maybeSingle();
    return data?.file_path || null;
  };

  const handleView = async (dl: DownloadRecord) => {
    setActionItemId(dl.id);
    const filePath = await getFilePath(dl);
    if (!filePath) {
      toast({ title: "File not found", description: "This resource may have been removed.", variant: "destructive" });
      setActionItemId(null);
      return;
    }
    const bucket = dl.item_type === "paper" ? "papers" : "notes";
    const result = await getSignedUrl({ bucket, filePath, itemId: dl.item_id });
    if (result.signedUrl) {
      setPreviewTitle(dl.item_title);
      setPreviewUrl(result.signedUrl);
    } else {
      toast({ title: "Error", description: result.error || "Could not load file.", variant: "destructive" });
    }
    setActionItemId(null);
  };

  const handleDownload = async (dl: DownloadRecord) => {
    setActionItemId(dl.id);
    const filePath = await getFilePath(dl);
    if (!filePath) {
      toast({ title: "File not found", description: "This resource may have been removed.", variant: "destructive" });
      setActionItemId(null);
      return;
    }
    const bucket = dl.item_type === "paper" ? "papers" : "notes";
    const result = await getSignedUrl({ bucket, filePath, itemId: dl.item_id });
    if (result.signedUrl) {
      await downloadSignedFile(result.signedUrl, `${dl.item_title}.pdf`);
      toast({ title: "Downloaded", description: `${dl.item_title} has been downloaded.` });
    } else {
      toast({ title: "Error", description: result.error || "Could not download file.", variant: "destructive" });
    }
    setActionItemId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Download className="h-8 w-8 text-primary" />
            Recent Downloads
          </h1>
          <p className="text-muted-foreground">
            Your complete download history for papers and notes.
          </p>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : downloads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Download className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No downloads yet</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Start exploring papers and notes to build your download history. Your downloaded resources will appear here for easy access.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {downloads.map((dl) => {
              const isActioning = actionItemId === dl.id && signingUrl;
              return (
                <Card key={dl.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg shrink-0 ${
                        dl.item_type === "paper"
                          ? "bg-primary/10"
                          : "bg-accent/10"
                      }`}
                    >
                      {dl.item_type === "paper" ? (
                        <FileText className="h-6 w-6 text-primary" />
                      ) : (
                        <StickyNote className="h-6 w-6 text-accent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {dl.item_title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {dl.item_subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {dl.item_level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(dl.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(dl)}
                        disabled={!!isActioning}
                        className="hidden sm:inline-flex"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(dl)}
                        disabled={!!isActioning}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Badge
                        variant="secondary"
                        className="capitalize hidden md:inline-flex"
                      >
                        {dl.item_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <PDFPreviewModal
        open={!!previewUrl}
        onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}
        signedUrl={previewUrl}
        title={previewTitle}
      />
    </div>
  );
};

export default Downloads;
