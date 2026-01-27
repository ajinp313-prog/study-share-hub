import { useState } from "react";
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
import { Upload, FileText, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Business Studies",
  "Psychology",
  "Law",
  "Medicine",
  "Engineering",
  "Other",
];

const levels = [
  { value: "10th", label: "10th Grade / Secondary" },
  { value: "+1", label: "+1 / 11th Grade" },
  { value: "+2", label: "+2 / 12th Grade" },
  { value: "Undergraduate", label: "Undergraduate / Bachelor's" },
  { value: "Graduate", label: "Graduate" },
  { value: "Masters", label: "Postgraduate / Master's" },
  { value: "Engineering", label: "Engineering" },
  { value: "PhD", label: "PhD / Doctoral" },
];

const POINTS_PER_UPLOAD = 50;

export const NoteUpload = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
    chapter_topic: "",
    university: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setUploading(true);

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(filePath, file);

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

      // Award points to user
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentPoints = profile?.points || 0;

      await supabase
        .from("profiles")
        .update({ points: currentPoints + POINTS_PER_UPLOAD })
        .eq("user_id", user.id);

      // Record points history
      await supabase.from("points_history").insert({
        user_id: user.id,
        points: POINTS_PER_UPLOAD,
        action: "note_upload",
        description: `Uploaded note: ${formData.title}`,
      });

      toast.success(`Note uploaded! You earned ${POINTS_PER_UPLOAD} points!`);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload note");
    } finally {
      setUploading(false);
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
              {file && <Check className="h-5 w-5 text-green-500" />}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
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
              <Label htmlFor="university">University/School</Label>
              <Input
                id="university"
                placeholder="e.g., MIT"
                value={formData.university}
                onChange={(e) =>
                  setFormData({ ...formData, university: e.target.value })
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
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
