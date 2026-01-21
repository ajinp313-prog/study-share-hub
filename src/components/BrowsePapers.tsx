import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, GraduationCap, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  subject: string;
  level: string;
  university: string | null;
  year: number | null;
  downloads: number;
  file_path: string;
}

const BrowsePapers = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("papers")
      .select("id, title, subject, level, university, year, downloads, file_path")
      .eq("status", "approved")
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

  const handleDownload = async (paper: Paper) => {
    setDownloading(paper.id);
    
    try {
      // Increment download count
      const { error: rpcError } = await supabase.rpc("increment_download_count", {
        paper_id: paper.id,
      });

      if (rpcError) {
        console.error("Error incrementing download:", rpcError);
      }

      // Get the file URL and trigger download
      const { data } = supabase.storage.from("papers").getPublicUrl(paper.file_path);
      
      // Create a temporary link to trigger download
      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${paper.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update local state
      setPapers(papers.map(p => 
        p.id === paper.id ? { ...p, downloads: p.downloads + 1 } : p
      ));

      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download paper");
    }
    
    setDownloading(null);
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (paper.university?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <section id="browse" className="py-8">
      <div className="container">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by subject, university, or keyword..."
              className="pl-12 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Papers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No papers match your search." : "No approved papers available yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="hover:shadow-md transition-all border-border group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {paper.title}
                      </h4>
                      {paper.university && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Building2 className="h-4 w-4" />
                          {paper.university}
                          {paper.year && <span>• {paper.year}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {paper.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {paper.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => handleView(paper.file_path)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handleDownload(paper)}
                        disabled={downloading === paper.id}
                      >
                        {downloading === paper.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                    <Download className="h-3 w-3 mr-1" />
                    {paper.downloads} downloads
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrowsePapers;
