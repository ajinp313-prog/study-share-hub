import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  FileText,
  Eye,
  Trash2,
  Download,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { getStatusBadge } from "@/lib/statusBadge";
import { toast } from "sonner";
import PDFPreviewModal from "@/components/PDFPreviewModal";

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  chapter_topic: string | null;
  status: string;
  downloads: number;
  created_at: string;
  file_path: string;
}

const MyNotes = () => {
  const { user } = useAuth();
  const { getSignedUrl } = useSignedUrl();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  // PDF Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (user) {
      fetchMyNotes();
    }
  }, [user]);

  const fetchMyNotes = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load your notes");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleView = async (note: Note) => {
    setViewing(note.id);
    try {
      const result = await getSignedUrl({
        bucket: "notes",
        filePath: note.file_path,
        itemId: note.id,
      });

      if (result.error) {
        toast.error(result.error);
        setViewing(null);
        return;
      }

      if (result.signedUrl) {
        setPreviewUrl(result.signedUrl);
        setPreviewTitle(note.title);
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view note");
    } finally {
      setViewing(null);
    }
  };

  const handleDelete = async (note: Note) => {
    setDeleting(note.id);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("notes")
        .remove([note.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (dbError) throw dbError;

      toast.success("Note deleted successfully");
      setNotes(notes.filter((n) => n.id !== note.id));
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete note");
    } finally {
      setDeleting(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-medium mb-2">No notes uploaded yet</h3>
        <p className="text-muted-foreground">
          Share your study notes and earn points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{note.title}</h4>
                    {note.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {note.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{note.subject}</Badge>
                      <Badge variant="outline">{note.level}</Badge>
                      {note.chapter_topic && (
                        <span className="text-xs">• {note.chapter_topic}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {getStatusBadge(note.status)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {note.downloads} downloads
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(note)}
                  disabled={viewing === note.id}
                >
                  {viewing === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleting === note.id}
                    >
                      {deleting === note.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{note.title}"? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(note)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        signedUrl={previewUrl}
        title={previewTitle}
      />
    </div>
  );
};

export default MyNotes;
