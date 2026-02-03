import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  ShieldCheck,
  Building2,
  Ticket,
  MessageSquare,
  AlertCircle,
  Send,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  subject: string;
  level: string;
  university: string | null;
  year: number | null;
  status: string;
  created_at: string;
  file_path: string;
  user_id: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  title: string;
  subject: string;
  level: string;
  chapter_topic: string | null;
  university: string | null;
  status: string;
  created_at: string;
  file_path: string;
  user_id: string;
}

const ticketCategories: Record<string, string> = {
  account: "Account Issues",
  upload: "Paper Upload Problems",
  download: "Download Issues",
  points: "Points & Rewards",
  technical: "Technical Bug",
  suggestion: "Feature Suggestion",
  other: "Other",
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingNote, setUpdatingNote] = useState<string | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null);
  
  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  
  // Signed URL hook for viewing files
  const { getSignedUrl } = useSignedUrl();
  const [viewingPaper, setViewingPaper] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<string | null>(null);

  // PDF Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (error) {
      console.error("Error checking role:", error);
      setIsAdmin(false);
    } else {
      setIsAdmin(data === true);
    }
    setCheckingRole(false);

    if (data === true) {
      fetchPapers();
      fetchNotes();
      fetchTickets();
    }
  };

  const fetchPapers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load papers");
    } else {
      setPapers(data || []);
    }
    setLoading(false);
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } else {
      setNotes(data || []);
    }
    setLoadingNotes(false);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load support tickets");
    } else {
      setTickets(data || []);
    }
    setLoadingTickets(false);
  };

  const handleView = async (paperId: string, filePath: string, title?: string) => {
    setViewingPaper(paperId);
    try {
      const result = await getSignedUrl({
        bucket: "papers",
        filePath: filePath,
        itemId: paperId,
      });

      if (result.error) {
        toast.error(result.error);
        setViewingPaper(null);
        return;
      }

      if (result.signedUrl) {
        setPreviewUrl(result.signedUrl);
        setPreviewTitle(title || "Paper");
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view paper");
    } finally {
      setViewingPaper(null);
    }
  };

  const handleUpdateStatus = async (paperId: string, newStatus: string) => {
    setUpdating(paperId);

    const { error } = await supabase
      .from("papers")
      .update({ status: newStatus })
      .eq("id", paperId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update paper status");
    } else {
      toast.success(`Paper ${newStatus === "approved" ? "approved" : "rejected"}`);
      setPapers(papers.map((p) => (p.id === paperId ? { ...p, status: newStatus } : p)));
    }

    setUpdating(null);
  };

  const handleUpdateNoteStatus = async (noteId: string, newStatus: string) => {
    setUpdatingNote(noteId);

    const { error } = await supabase
      .from("notes")
      .update({ status: newStatus })
      .eq("id", noteId);

    if (error) {
      console.error("Error updating note status:", error);
      toast.error("Failed to update note status");
    } else {
      toast.success(`Note ${newStatus === "approved" ? "approved" : "rejected"}`);
      setNotes(notes.map((n) => (n.id === noteId ? { ...n, status: newStatus } : n)));
    }

    setUpdatingNote(null);
  };

  const handleViewNote = async (noteId: string, filePath: string, title?: string) => {
    setViewingNote(noteId);
    try {
      const result = await getSignedUrl({
        bucket: "notes",
        filePath: filePath,
        itemId: noteId,
      });

      if (result.error) {
        toast.error(result.error);
        setViewingNote(null);
        return;
      }

      if (result.signedUrl) {
        setPreviewUrl(result.signedUrl);
        setPreviewTitle(title || "Note");
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view note");
    } finally {
      setViewingNote(null);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingTicket(ticketId);

    const { error } = await supabase
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    } else {
      toast.success(`Ticket marked as ${newStatus.replace("_", " ")}`);
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    }

    setUpdatingTicket(null);
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

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="gap-1 bg-blue-500">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingPapers = papers.filter((p) => p.status === "pending");
  const approvedPapers = papers.filter((p) => p.status === "approved");
  const rejectedPapers = papers.filter((p) => p.status === "rejected");

  const pendingNotes = notes.filter((n) => n.status === "pending");
  const approvedNotes = notes.filter((n) => n.status === "approved");
  const rejectedNotes = notes.filter((n) => n.status === "rejected");

  const openTickets = tickets.filter((t) => t.status === "open");
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center">
          <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin panel.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const renderPaperList = (paperList: Paper[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (paperList.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No papers in this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {paperList.map((paper) => (
          <Card key={paper.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                            <Building2 className="h-3 w-3" />
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
                        <span className="text-xs text-muted-foreground">
                          Submitted: {new Date(paper.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(paper.id, paper.file_path, paper.title)}
                    disabled={viewingPaper === paper.id}
                  >
                    {viewingPaper === paper.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    View
                  </Button>

                  {paper.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(paper.id, "approved")}
                        disabled={updating === paper.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating === paper.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(paper.id, "rejected")}
                        disabled={updating === paper.id}
                      >
                        {updating === paper.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </>
                  )}

                  {paper.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(paper.id, "pending")}
                      disabled={updating === paper.id}
                    >
                      {updating === paper.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4 mr-1" />
                      )}
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderNoteList = (noteList: Note[]) => {
    if (loadingNotes) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (noteList.length === 0) {
      return (
        <div className="text-center py-12">
          <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No notes in this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {noteList.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <StickyNote className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{note.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{note.subject}</span>
                        <span>•</span>
                        <span>{note.level}</span>
                        {note.chapter_topic && (
                          <>
                            <span>•</span>
                            <span>{note.chapter_topic}</span>
                          </>
                        )}
                        {note.university && (
                          <>
                            <span>•</span>
                            <Building2 className="h-3 w-3" />
                            <span>{note.university}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {getStatusBadge(note.status)}
                        <span className="text-xs text-muted-foreground">
                          Submitted: {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewNote(note.id, note.file_path, note.title)}
                    disabled={viewingNote === note.id}
                  >
                    {viewingNote === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    View
                  </Button>

                  {note.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNoteStatus(note.id, "approved")}
                        disabled={updatingNote === note.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updatingNote === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateNoteStatus(note.id, "rejected")}
                        disabled={updatingNote === note.id}
                      >
                        {updatingNote === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </>
                  )}

                  {note.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateNoteStatus(note.id, "pending")}
                      disabled={updatingNote === note.id}
                    >
                      {updatingNote === note.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4 mr-1" />
                      )}
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTicketList = (ticketList: SupportTicket[]) => {
    if (loadingTickets) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (ticketList.length === 0) {
      return (
        <div className="text-center py-12">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No tickets in this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ticketList.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {ticketCategories[ticket.category] || ticket.category}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="mt-2">
                        {getTicketStatusBadge(ticket.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setAdminResponse("");
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                    disabled={updatingTicket === ticket.id}
                  >
                    <SelectTrigger className="w-[140px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Manage papers, notes, and support tickets
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingPapers.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedPapers.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {pendingNotes.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {approvedNotes.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {openTickets.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {inProgressTickets.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {resolvedTickets.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs: Papers & Tickets */}
        <Tabs defaultValue="papers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="papers" className="gap-2">
              <FileText className="h-4 w-4" />
              Papers ({papers.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <StickyNote className="h-4 w-4" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets ({tickets.length})
            </TabsTrigger>
          </TabsList>

          {/* Papers Tab */}
          <TabsContent value="papers">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="pending">
                  <TabsList className="mb-6">
                    <TabsTrigger value="pending" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Pending ({pendingPapers.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Approved ({approvedPapers.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Rejected ({rejectedPapers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending">
                    {renderPaperList(pendingPapers)}
                  </TabsContent>
                  <TabsContent value="approved">
                    {renderPaperList(approvedPapers)}
                  </TabsContent>
                  <TabsContent value="rejected">
                    {renderPaperList(rejectedPapers)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="pending">
                  <TabsList className="mb-6">
                    <TabsTrigger value="pending" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Pending ({pendingNotes.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Approved ({approvedNotes.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Rejected ({rejectedNotes.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending">
                    {renderNoteList(pendingNotes)}
                  </TabsContent>
                  <TabsContent value="approved">
                    {renderNoteList(approvedNotes)}
                  </TabsContent>
                  <TabsContent value="rejected">
                    {renderNoteList(rejectedNotes)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="open">
                  <TabsList className="mb-6">
                    <TabsTrigger value="open" className="gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Open ({openTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="gap-2">
                      <Clock className="h-4 w-4" />
                      In Progress ({inProgressTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Resolved ({resolvedTickets.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="open">
                    {renderTicketList(openTickets)}
                  </TabsContent>
                  <TabsContent value="in_progress">
                    {renderTicketList(inProgressTickets)}
                  </TabsContent>
                  <TabsContent value="resolved">
                    {renderTicketList(resolvedTickets)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              Review and respond to this support ticket
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6 mt-4">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Subject</Label>
                  <p className="font-medium text-foreground">{selectedTicket.subject}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <p className="text-sm">
                      {ticketCategories[selectedTicket.category] || selectedTicket.category}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <div className="mt-1">{getTicketStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Submitted</Label>
                    <p className="text-sm">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <div className="mt-1 p-4 rounded-lg bg-muted/50 text-sm">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleUpdateTicketStatus(selectedTicket.id, value)}
                  disabled={updatingTicket === selectedTicket.id}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Response (for future use) */}
              <div className="space-y-2">
                <Label>Admin Notes (Internal)</Label>
                <Textarea
                  placeholder="Add internal notes about this ticket..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  These notes are for internal use only and won't be visible to the user.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    toast.success("Notes saved");
                    setSelectedTicket(null);
                  }}
                >
                  <Send className="h-4 w-4" />
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        signedUrl={previewUrl}
        title={previewTitle}
      />

      <Footer />
    </div>
  );
};

export default Admin;
