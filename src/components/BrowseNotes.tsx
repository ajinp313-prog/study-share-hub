import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { downloadSignedFile, openSignedFileInNewTab } from "@/lib/signedFile";

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  chapter_topic: string | null;
  university: string | null;
  downloads: number;
  created_at: string;
  file_path: string;
}

// Subjects mapped by academic level
const subjectsByLevel: Record<string, string[]> = {
  "10th": [
    "Mathematics",
    "Science",
    "Social Science",
    "English",
    "Hindi",
    "Computer Science",
    "Other",
  ],
  "+1": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Accountancy",
    "Business Studies",
    "Economics",
    "English",
    "History",
    "Geography",
    "Political Science",
    "Other",
  ],
  "+2": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Accountancy",
    "Business Studies",
    "Economics",
    "English",
    "History",
    "Geography",
    "Political Science",
    "Other",
  ],
  "Undergraduate": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Business Administration",
    "Commerce",
    "English Literature",
    "History",
    "Psychology",
    "Sociology",
    "Political Science",
    "Law",
    "Other",
  ],
  "Graduate": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Business Administration",
    "Commerce",
    "English Literature",
    "History",
    "Psychology",
    "Sociology",
    "Political Science",
    "Law",
    "Other",
  ],
  "Masters": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Business Administration (MBA)",
    "Commerce",
    "English Literature",
    "History",
    "Psychology",
    "Sociology",
    "Political Science",
    "Law",
    "Medicine",
    "Other",
  ],
  "Engineering": [
    "Computer Science Engineering",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Information Technology",
    "Aerospace Engineering",
    "Biotechnology",
    "Data Science",
    "Artificial Intelligence",
    "Other",
  ],
  "PhD": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Engineering",
    "Medicine",
    "Psychology",
    "Philosophy",
    "Literature",
    "Other",
  ],
};

const levels = [
  { value: "all", label: "All Levels" },
  { value: "10th", label: "10th Grade" },
  { value: "+1", label: "+1 / 11th Grade" },
  { value: "+2", label: "+2 / 12th Grade" },
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Graduate", label: "Graduate" },
  { value: "Masters", label: "Masters" },
  { value: "Engineering", label: "Engineering" },
  { value: "PhD", label: "PhD" },
];

const BrowseNotes = () => {
  const { user } = useAuth();
  const { getSignedUrl } = useSignedUrl();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [levelFilter, setLevelFilter] = useState("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  // Get subjects based on selected level
  const availableSubjects = useMemo(() => {
    if (levelFilter === "all") {
      // When "All Levels" is selected, show all unique subjects across all levels
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
    fetchNotes();
  }, [subjectFilter, levelFilter]);

  const fetchNotes = async () => {
    setLoading(true);
    // Use notes_public view which excludes user_id for privacy
    let query = supabase
      .from("notes_public")
      .select("*")
      .order("created_at", { ascending: false });

    if (subjectFilter !== "All Subjects") {
      query = query.eq("subject", subjectFilter);
    }

    if (levelFilter !== "all") {
      query = query.eq("level", levelFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } else {
      // Filter out any notes with null required fields from the view and map to Note type
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
          downloads: note.downloads as number,
          created_at: note.created_at as string,
          file_path: note.file_path as string,
        }));
      setNotes(validNotes);
    }
    setLoading(false);
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
        await openSignedFileInNewTab(result.signedUrl, { title: note.title });
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view note");
    } finally {
      setViewing(null);
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

      // Trigger download via blob URL (avoids navigating to blocked domains)
      await downloadSignedFile(result.signedUrl, `${note.title}.pdf`);

      toast.success("Download started!");

      // Refresh to update download count
      fetchNotes();
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
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select level first" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {levels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="flex-1 sm:w-[200px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {availableSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {searchQuery || subjectFilter !== "All Subjects" || levelFilter !== "all"
              ? "Try adjusting your filters"
              : "Be the first to upload notes!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseNotes;
