import { useState, useMemo } from "react";
import { REWARDS } from "@/constants/rewards";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadProgress } from "@/components/ui/upload-progress";
import { PDFFilePreview } from "@/components/PDFFilePreview";
import { sanitizeFileName, isPdfMagicBytes } from "@/lib/sanitize";
import logger from "@/lib/logger";
import { ALL_LEVELS, BOARDS, UNIVERSITIES, getInstitutionType } from "@/constants/education";

// Subjects mapped by academic level
const subjectsByLevel: Record<string, string[]> = {
  "10th": [
    "Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science", "Other"
  ],
  "+1": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Accountancy", "Business Studies", "Economics", "English", "History",
    "Geography", "Political Science", "Other"
  ],
  "+2": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Accountancy", "Business Studies", "Economics", "English", "History",
    "Geography", "Political Science", "Other"
  ],
  "UG": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Economics", "Business Administration", "Commerce", "English Literature",
    "History", "Psychology", "Sociology", "Political Science", "Law", "Nursing", "Other"
  ],
  "PG": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Economics", "Business Administration (MBA)", "Commerce", "English Literature",
    "History", "Psychology", "Sociology", "Political Science", "Law", "Other"
  ],
  "Engineering": [
    "Computer Science Engineering", "Electronics & Communication", "Electrical",
    "Mechanical", "Civil", "Chemical", "Information Technology",
    "Biotechnology", "Data Science", "Artificial Intelligence", "Other"
  ],
  "Medical": [
    "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
    "Microbiology", "Community Medicine", "Internal Medicine", "Surgery",
    "Pediatrics", "Obstetrics & Gynecology", "Other"
  ],
  "Diploma": [
    "Civil Engineering", "Mechanical Engineering", "Electrical Engineering",
    "Computer Engineering", "Automobile Engineering", "Pharmacy", "Other"
  ]
};

const levels = ALL_LEVELS.map(level => ({ value: level, label: level }));

const POINTS_PER_UPLOAD = REWARDS.NOTES_UPLOAD;

export const NoteUpload = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { progress, uploading, uploadFile, resetUpload } = useFileUpload();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
    chapter_topic: "",
    university: "",
  });

  // Get subjects based on selected level
  const availableSubjects = useMemo(() => {
    if (!formData.level) return [];
    return subjectsByLevel[formData.level] || [];
  }, [formData.level]);

  const institutionType = getInstitutionType(formData.level);

  const handleLevelChange = (value: string) => {
    const oldType = getInstitutionType(formData.level);
    const newType = getInstitutionType(value);
    const newUniversity = oldType !== newType ? "" : formData.university;
    setFormData({ ...formData, level: value, subject: "", university: newUniversity });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      // Validate magic bytes (%PDF) — prevents renamed non-PDF files.
      const validPdf = await isPdfMagicBytes(selectedFile);
      if (!validPdf) {
        toast.error("Invalid PDF file. Please upload a genuine PDF document.");
        return;
      }
      setFile(selectedFile);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    try {
      // Sanitize file name to prevent path traversal and storage-path injection.
      const safeFileName = sanitizeFileName(file.name);
      const filePath = `${user.id}/${Date.now()}_${safeFileName}`;
      const { error: uploadError } = await uploadFile("notes", filePath, file);

      if (uploadError) throw uploadError;

      // Create note record
      const { error: insertError } = await supabase.from("notes").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        subject: formData.subject,
        level: formData.level,
        chapter_topic: formData.chapter_topic || null,
        university: formData.university || null,
        file_path: filePath,
        file_size: file.size,
      });

      if (insertError) throw insertError;

      // Award points using secure server-side function
      const { data: pointsAwarded } = await supabase.rpc("award_upload_points", {
        p_user_id: user.id,
        p_action: "note_upload",
        p_description: `Uploaded note: ${formData.title}`,
      });

      if (pointsAwarded) {
        toast.success(`Note uploaded! You earned ${POINTS_PER_UPLOAD} points!`);
      } else {
        toast.success("Note uploaded successfully!");
      }
      setOpen(false);
      resetForm();
    } catch (error: unknown) {
      logger.error("Note upload error", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload note");
    }
  };


  const resetForm = () => {
    setFile(null);
    setFormData({
      title: "",
      description: "",
      subject: "",
      level: "",
      chapter_topic: "",
      university: "",
    });
    resetUpload();
  };

  if (!user) {
    return (
      <Button variant="outline" disabled>
        <Upload className="mr-2 h-4 w-4" />
        Sign in to Upload
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary hover:bg-primary/90">
          <Upload className="mr-2 h-4 w-4" />
          Upload Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Subject Note</DialogTitle>
          <DialogDescription>
            Share your notes and earn {POINTS_PER_UPLOAD} points!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">PDF File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="flex-1"
              />
              {file && <Check className="h-5 w-5 text-primary" />}
            </div>
            {file && <PDFFilePreview file={file} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Calculus Chapter 3 Notes"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your notes..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level *</Label>
              <Select
                value={formData.level}
                onValueChange={handleLevelChange}
                required
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
                required
                disabled={!formData.level}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.level ? "Select subject" : "Select level first"} />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chapter_topic">Chapter/Topic</Label>
              <Input
                id="chapter_topic"
                placeholder="e.g., Integration"
                value={formData.chapter_topic}
                onChange={(e) =>
                  setFormData({ ...formData, chapter_topic: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">
                {institutionType === "school" ? "Education Board" : "University"} *
              </Label>
              <Select
                value={formData.university}
                onValueChange={(value) =>
                  setFormData({ ...formData, university: value })
                }
                disabled={!formData.level}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.level ? "Select Level First" : `Select ${institutionType === 'school' ? 'Board' : 'University'}`} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {formData.level && (institutionType === "school" ? BOARDS : UNIVERSITIES).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <UploadProgress progress={progress} isVisible={uploading} />

          <Button type="submit" className="w-full" disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Earn {POINTS_PER_UPLOAD} Points
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
