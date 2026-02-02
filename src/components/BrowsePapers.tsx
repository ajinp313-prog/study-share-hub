import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, GraduationCap, Building2, Loader2, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/hooks/useSignedUrl";
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
  const { user } = useAuth();
  const { getSignedUrl } = useSignedUrl();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  
  // Filter states
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("");

  // Predefined study levels
  const studyLevels = [
    "10th",
    "+1",
    "+2",
    "Undergraduate",
    "Graduate",
    "Masters",
    "Engineering",
    "PhD"
  ];

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


  const handleView = async (paper: Paper) => {
    if (!user) {
      toast.error("Please sign in to view papers");
      return;
    }

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
        // Use window.location.assign for more reliable navigation
        // or create a temporary link and click it
        const link = document.createElement("a");
        link.href = result.signedUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view paper");
    } finally {
      setViewing(null);
    }
  };

  const handleDownload = async (paper: Paper) => {
    if (!user) {
      toast.error("Please sign in to download papers");
      return;
    }

    setDownloading(paper.id);
    
    try {
      // Get signed URL for download
      const result = await getSignedUrl({
        bucket: "papers",
        filePath: paper.file_path,
        itemId: paper.id,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (!result.signedUrl) {
        toast.error("Failed to get download URL");
        return;
      }

      // Increment download count
      const { error: rpcError } = await supabase.rpc("increment_download_count", {
        paper_id: paper.id,
      });

      if (rpcError) {
        console.error("Error incrementing download:", rpcError);
      }

      // Trigger download using signed URL
      const response = await fetch(result.signedUrl);
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

  const clearFilters = () => {
    setLevelFilter("all");
    setYearFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = levelFilter !== "all" || yearFilter !== "" || searchQuery !== "";

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      // Text search
      const matchesSearch = searchQuery === "" ||
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paper.university?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      // Level filter
      const matchesLevel = levelFilter === "all" || paper.level === levelFilter;
      
      // Year filter - partial match for typed input
      const matchesYear = yearFilter === "" || String(paper.year).includes(yearFilter);
      
      return matchesSearch && matchesLevel && matchesYear;
    });
  }, [papers, searchQuery, levelFilter, yearFilter]);

  return (
    <section id="browse" className="py-8">
      <div className="container">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
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

        {/* Filter Options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-8 px-2 sm:px-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-start">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Level Filter */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background text-sm">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Levels</SelectItem>
                {studyLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Filter - Text Input */}
            <Input
              type="text"
              placeholder="Year"
              className="w-full sm:w-[120px] bg-background text-sm"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="gap-1 text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-center text-sm text-muted-foreground mb-6">
            Showing {filteredPapers.length} of {papers.length} papers
          </p>
        )}

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
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="hover:shadow-md transition-all border-border group"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-2">
                        {paper.title}
                      </h4>
                      {paper.university && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{paper.university}</span>
                          {paper.year && <span className="flex-shrink-0">• {paper.year}</span>}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {paper.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {paper.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => handleView(paper)}
                        disabled={viewing === paper.id}
                      >
                        {viewing === paper.id ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => handleDownload(paper)}
                        disabled={downloading === paper.id}
                      >
                        {downloading === paper.id ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
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
