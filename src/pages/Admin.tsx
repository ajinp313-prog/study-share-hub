import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  ShieldCheck,
  Building2,
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

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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

  const handleView = (filePath: string) => {
    const { data } = supabase.storage.from("papers").getPublicUrl(filePath);
    window.open(data.publicUrl, "_blank");
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

  const pendingPapers = papers.filter((p) => p.status === "pending");
  const approvedPapers = papers.filter((p) => p.status === "approved");
  const rejectedPapers = papers.filter((p) => p.status === "rejected");

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
                    onClick={() => handleView(paper.file_path)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
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
            Review and manage paper submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
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
                Approved
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
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {rejectedPapers.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Papers Tabs */}
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
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
