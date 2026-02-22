import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  BookOpen,
  School,
  Search,
  ArrowRight,
  FileText,
  StickyNote,
  Loader2,
  ChevronLeft,
  Stethoscope,
} from "lucide-react";

interface SubjectCount {
  subject: string;
  level: string;
  paper_count: number;
  note_count: number;
}

const DEGREE_CATEGORIES = [
  {
    id: "school",
    title: "School Level",
    description: "10th, +1 & +2 exam papers and study notes",
    icon: School,
    levels: ["10th", "+1", "+2"],
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "ug",
    title: "Undergraduate",
    description: "Bachelor's degree & Engineering resources",
    icon: BookOpen,
    levels: ["Undergraduate", "Engineering"],
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "pg",
    title: "Postgraduate",
    description: "Master's & Graduate academic materials",
    icon: GraduationCap,
    levels: ["Graduate", "Masters"],
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    id: "medical",
    title: "Medical Field",
    description: "MBBS, MD & PhD medical resources",
    icon: Stethoscope,
    levels: ["MBBS", "MD", "PhD"],
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
];

const Catalog = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const [subjectCounts, setSubjectCounts] = useState<SubjectCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSubjectCounts();
  }, []);

  const fetchSubjectCounts = async () => {
    setLoading(true);

    // Fetch approved papers grouped by subject+level
    const { data: papers } = await supabase
      .from("papers_public" as any)
      .select("subject, level")
      .eq("status", "approved");

    // Fetch approved notes grouped by subject+level
    const { data: notes } = await supabase
      .from("notes_public")
      .select("subject, level")
      .eq("status", "approved");

    const countMap = new Map<string, SubjectCount>();

    ((papers || []) as unknown as { subject: string; level: string }[]).forEach((p) => {
      const key = `${p.subject}__${p.level}`;
      const existing = countMap.get(key) || {
        subject: p.subject,
        level: p.level,
        paper_count: 0,
        note_count: 0,
      };
      existing.paper_count++;
      countMap.set(key, existing);
    });

    (notes || []).forEach((n) => {
      if (!n.subject || !n.level) return;
      const key = `${n.subject}__${n.level}`;
      const existing = countMap.get(key) || {
        subject: n.subject,
        level: n.level,
        paper_count: 0,
        note_count: 0,
      };
      existing.note_count++;
      countMap.set(key, existing);
    });

    setSubjectCounts(Array.from(countMap.values()));
    setLoading(false);
  };

  const activeCategoryData = useMemo(
    () => DEGREE_CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  const filteredSubjects = useMemo(() => {
    if (!activeCategoryData) return [];
    return subjectCounts
      .filter(
        (s) =>
          activeCategoryData.levels.includes(s.level) &&
          (searchQuery === "" ||
            s.subject.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [subjectCounts, activeCategoryData, searchQuery]);

  // Group filtered subjects by level
  const groupedByLevel = useMemo(() => {
    const groups: Record<string, SubjectCount[]> = {};
    filteredSubjects.forEach((s) => {
      if (!groups[s.level]) groups[s.level] = [];
      groups[s.level].push(s);
    });
    return groups;
  }, [filteredSubjects]);

  const handleSubjectClick = (subject: string, level: string) => {
    if (!user) return;
    // Navigate to papers page with search pre-filled
    navigate(`/papers?search=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}`);
  };

  // Category totals
  const getCategoryStats = (levels: string[]) => {
    const relevant = subjectCounts.filter((s) => levels.includes(s.level));
    const papers = relevant.reduce((sum, s) => sum + s.paper_count, 0);
    const notes = relevant.reduce((sum, s) => sum + s.note_count, 0);
    const subjects = new Set(relevant.map((s) => s.subject)).size;
    return { papers, notes, subjects };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 gap-1 text-muted-foreground"
              onClick={() => {
                setSearchParams({});
                setSearchQuery("");
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              All Categories
            </Button>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {activeCategoryData ? activeCategoryData.title : "Course Catalog"}
          </h1>
          <p className="text-muted-foreground">
            {activeCategoryData
              ? activeCategoryData.description
              : "Browse study materials organized by degree level and subject"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !selectedCategory ? (
          /* Category Cards */
          <div className="grid gap-6 md:grid-cols-3">
            {DEGREE_CATEGORIES.map((cat) => {
              const stats = getCategoryStats(cat.levels);
              const Icon = cat.icon;
              return (
                <Card
                  key={cat.id}
                  className={`group cursor-pointer hover:shadow-card-hover transition-all duration-300 border ${cat.borderColor} overflow-hidden`}
                  onClick={() => setSearchParams({ category: cat.id })}
                >
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br ${cat.gradient} mb-4`}
                    >
                      <Icon className={`h-7 w-7 ${cat.iconColor}`} />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {cat.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {cat.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {stats.papers} papers
                      </span>
                      <span className="flex items-center gap-1">
                        <StickyNote className="h-3.5 w-3.5" />
                        {stats.notes} notes
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.levels.map((level) => (
                        <Badge key={level} variant="secondary" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse subjects
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Subject Listing */
          <div>
            {/* Search */}
            <div className="max-w-md mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {Object.keys(groupedByLevel).length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No subjects match your search."
                    : "No materials available in this category yet."}
                </p>
              </div>
            ) : (
              Object.entries(groupedByLevel).map(([level, subjects]) => (
                <div key={level} className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {level}
                    <Badge variant="outline" className="ml-1 text-xs font-normal">
                      {subjects.length} subjects
                    </Badge>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((s) => (
                      <Card
                        key={`${s.subject}-${s.level}`}
                        className="group cursor-pointer hover:shadow-card-hover hover:border-primary/30 transition-all"
                        onClick={() => handleSubjectClick(s.subject, s.level)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {s.subject}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {s.paper_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {s.paper_count} papers
                                </span>
                              )}
                              {s.note_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <StickyNote className="h-3 w-3" />
                                  {s.note_count} notes
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
