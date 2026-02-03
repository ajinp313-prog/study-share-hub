import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { openSignedFileInNewTab } from "@/lib/signedFile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Paper {
  id: string;
  title: string;
  subject: string;
  level: string;
  university: string | null;
  year: number | null;
  downloads: number;
  status: string;
  created_at: string;
  file_path: string;
}

const MyUploads = () => {
  const { user } = useAuth();
  const { getSignedUrl } = useSignedUrl();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyPapers();
    }
  }, [user]);

  const fetchMyPapers = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load your uploads");
    } else {
      setPapers(data || []);
    }
    setLoading(false);
  };

  const handleView = async (paper: Paper) => {
    setViewing(paper.id);
    try {
      const result = await getSignedUrl({
        bucket: "papers",
        filePath: paper.file_path,
        itemId: paper.id,
      });

      if (result.error) {
        toast.error(result.error);
        setViewing(null);
        return;
      }

      if (result.signedUrl) {
        await openSignedFileInNewTab(result.signedUrl, { title: paper.title });
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view paper");
    } finally {
      setViewing(null);
    }
  };

  const handleDelete = async (paperId: string, filePath: string) => {
    setDeleting(paperId);
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("papers")
      .remove([filePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("papers")
      .delete()
      .eq("id", paperId);

    if (dbError) {
      toast.error("Failed to delete paper");
      console.error("Delete error:", dbError);
    } else {
      toast.success("Paper deleted successfully");
      setPapers(papers.filter(p => p.id !== paperId));
    }
    
    setDeleting(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
        <p className="text-muted-foreground text-sm">
          Upload your first paper to earn points and help fellow students!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        You have uploaded {papers.length} paper{papers.length !== 1 ? "s" : ""}
      </p>
      
      {papers.map((paper) => (
        <Card key={paper.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{paper.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{paper.subject}</span>
                      <span>•</span>
                      <span>{paper.level}</span>
                      {paper.university && (
                        <>
                          <span>•</span>
                          <span>{paper.university}</span>
                        </>
                      )}
                      {paper.year && (
                        <>
                          <span>•</span>
                          <span>{paper.year}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {getStatusBadge(paper.status)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {paper.downloads} downloads
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-3 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(paper)}
                  disabled={viewing === paper.id}
                  className="flex-1 md:flex-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  {viewing === paper.id ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      View
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 sm:h-9 px-2 sm:px-3"
                      disabled={deleting === paper.id}
                    >
                      {deleting === paper.id ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Paper</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{paper.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(paper.id, paper.file_path)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyUploads;
