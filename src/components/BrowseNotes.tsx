import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ALL_LEVELS, BOARDS, UNIVERSITIES, getInstitutionType, getSemestersForLevel } from "@/constants/education";
import { subjectsByLevel } from "@/constants/subjects";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Download,
  Eye,
  BookOpen,
  Building2,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { downloadSignedFile } from "@/lib/signedFile";
import PDFPreviewModal from "@/components/PDFPreviewModal";

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  chapter_topic: string | null;
  university: string | null;
  semester?: number;
  downloads: number;
  created_at: string;
  file_path: string;
}


const PAGE_SIZE = 20;

const BrowseNotes = () => {
  const { user } = useAuth();
  const { getSignedUrl } = useSignedUrl();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [levelFilter, setLevelFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [downloading, setDownloading] = useState<string | null>(null);

  const institutionType = getInstitutionType(levelFilter);
  const [viewing, setViewing] = useState<string | null>(null);

  // PDF Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Get subjects based on selected level
  const availableSubjects = useMemo(() => {
    if (levelFilter === "all") {
      const allSubjects = new Set<string>();
      Object.values(subjectsByLevel).forEach(subjects => {
        subjects.forEach(subject => allSubjects.add(subject));
      });
      return ["All Subjects", ...Array.from(allSubjects).sort()];
    }
    return ["All Subjects", ...(subjectsByLevel[levelFilter] || [])];
  }, [levelFilter]);

  // Reset subject filter when level changes and current subject is not available
  useEffect(() => {
    if (subjectFilter !== "All Subjects" && !availableSubjects.includes(subjectFilter)) {
      setSubjectFilter("All Subjects");
    }
  }, [levelFilter, availableSubjects, subjectFilter]);

  useEffect(() => {
    fetchNotes(true);
  }, [subjectFilter, levelFilter, universityFilter, semesterFilter]);

  const fetchNotes = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setNotes([]);
    } else {
      setLoadingMore(true);
    }

    const currentNotes = reset ? [] : notes;
    const from = currentNotes.length;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (subjectFilter !== "All Subjects") {
      query = query.eq("subject", subjectFilter);
    }

    if (levelFilter !== "all") {
      query = query.eq("level", levelFilter);
    }

    if (universityFilter !== "all") {
      query = query.eq("university", universityFilter);
    }

    if (semesterFilter !== "all") {
      query = query.eq("semester", parseInt(semesterFilter));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } else {
      const validNotes: Note[] = (data || [])
        .filter(note =>
          note.id !== null &&
          note.title !== null &&
          note.subject !== null &&
          note.level !== null &&
          note.file_path !== null &&
          note.downloads !== null &&
          note.created_at !== null
        )
        .map(note => ({
          id: note.id as string,
          title: note.title as string,
          description: note.description,
          subject: note.subject as string,
          level: note.level as string,
          chapter_topic: note.chapter_topic,
          university: note.university,
          semester: note.semester as number | undefined,
          downloads: note.downloads as number,
          created_at: note.created_at as string,
          file_path: note.file_path as string,
        }));
      setNotes(prev => reset ? validNotes : [...prev, ...validNotes]);
      setHasMore(validNotes.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleView = async (note: Note) => {
    if (!user) {
      toast.error("Please sign in to view notes");
      return;
    }

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
        setPreviewNote(note);
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view note");
    } finally {
      setViewing(null);
    }
  };

  const handlePreviewDownload = () => {
    if (previewNote) {
      handleDownload(previewNote);
    }
  };

  const handleDownload = async (note: Note) => {
    if (!user) {
      toast.error("Please sign in to download notes");
      return;
    }

    setDownloading(note.id);

    try {
      // Get signed URL for download
      const result = await getSignedUrl({
        bucket: "notes",
        filePath: note.file_path,
        itemId: note.id,
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
      await supabase.rpc("increment_note_download_count", { note_id: note.id });

      // Record download in history
      if (user) {
        await supabase.from("download_history").insert({
          user_id: user.id,
          item_id: note.id,
          item_type: "note",
          item_title: note.title,
          item_subject: note.subject,
          item_level: note.level,
        });
      }

      // Trigger download via blob URL (avoids navigating to blocked domains)
      await downloadSignedFile(result.signedUrl, `${note.title}.pdf`);

      toast.success("Download started!");

      // Update local state for download count
      setNotes(prev => prev.map(n =>
        n.id === note.id ? { ...n, downloads: n.downloads + 1 } : n
      ));
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download note");
    } finally {
      setDownloading(null);
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.description?.toLowerCase().includes(query) ||
      note.chapter_topic?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, description, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={levelFilter} onValueChange={(val) => {
              setLevelFilter(val);
              const newType = getInstitutionType(val);
              if (institutionType !== newType) setUniversityFilter("all");
              setSemesterFilter("all");
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select level first" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Levels</SelectItem>
                {ALL_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {institutionType && (
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="flex-1 sm:w-[200px] truncate">
                <SelectValue placeholder={institutionType === "school" ? "All Boards" : "All Universities"} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">
                  {institutionType === "school" ? "All Boards" : "All Universities"}
                </SelectItem>
                {(institutionType === "school" ? BOARDS : UNIVERSITIES).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="flex-1 sm:w-[200px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="All Subjects">All Subjects</SelectItem>
              {availableSubjects.filter(s => s !== "All Subjects").map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {getSemestersForLevel(levelFilter) > 0 && (
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="flex-1 sm:w-[150px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Semesters</SelectItem>
                {Array.from({ length: getSemestersForLevel(levelFilter) }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Semester {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground">
            {searchQuery || subjectFilter !== "All Subjects" || levelFilter !== "all" || universityFilter !== "all"
              ? "Try adjusting your filters"
              : "Be the first to upload notes!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (index % 10) * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-2">
                          {note.title}
                        </h4>
                        {note.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {note.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{note.subject}</Badge>
                      <Badge variant="outline">{note.level}</Badge>
                      {note.chapter_topic && (
                        <Badge variant="outline" className="text-xs">
                          {note.chapter_topic}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {note.university && (
                        <>
                          <Building2 className="h-3 w-3" />
                          <span>{note.university}</span>
                          <span>•</span>
                        </>
                      )}
                      <Download className="h-3 w-3" />
                      <span>{note.downloads} downloads</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
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
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(note)}
                        disabled={downloading === note.id}
                      >
                        {downloading === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {hasMore && !searchQuery && subjectFilter === "All Subjects" && levelFilter === "all" && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchNotes(false)}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Load More Notes
              </Button>
            </div>
          )}
        </>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        signedUrl={previewUrl}
        title={previewTitle}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
};

export default BrowseNotes;
