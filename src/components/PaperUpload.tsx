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
import { Upload, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadProgress } from "@/components/ui/upload-progress";
import { PDFFilePreview } from "@/components/PDFFilePreview";

const schoolSubjects = [
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
];

const FREE_TEXT_LEVELS = ["Engineering", "Graduate", "Masters", "PhD", "MBBS", "MD"];

const levels = [
  { value: "10th", label: "10th Grade / Secondary" },
  { value: "+1", label: "+1 / 11th Grade" },
  { value: "+2", label: "+2 / 12th Grade" },
  { value: "Undergraduate", label: "Undergraduate / Bachelor's" },
  { value: "Graduate", label: "Graduate" },
  { value: "Masters", label: "Postgraduate / Master's" },
  { value: "Engineering", label: "Engineering" },
  { value: "MBBS", label: "MBBS" },
  { value: "MD", label: "MD" },
  { value: "PhD", label: "PhD / Doctoral" },
];

const POINTS_PER_UPLOAD = 20;

export const PaperUpload = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { progress, uploading, uploadFile, resetUpload } = useFileUpload();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
    university: "",
    year: "",
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

    try {
      // Upload file to storage with progress tracking
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await uploadFile("papers", filePath, file);

      if (uploadError) throw uploadError;

      // Create paper record
      const { error: insertError } = await supabase.from("papers").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        level: formData.level,
        university: formData.university || null,
        year: formData.year ? parseInt(formData.year) : null,
        file_path: filePath,
        file_size: file.size,
      });

      if (insertError) throw insertError;

      // Award points using secure server-side function
      const { data: pointsAwarded } = await supabase.rpc("award_upload_points", {
        p_user_id: user.id,
        p_action: "paper_upload",
        p_description: `Uploaded paper: ${formData.title}`,
      });

      if (pointsAwarded) {
        toast.success(`Paper uploaded! You earned ${POINTS_PER_UPLOAD} points!`);
      } else {
        toast.success("Paper uploaded successfully!");
      }
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload paper");
    }
  };

  const resetForm = () => {
    setFile(null);
    setFormData({
      title: "",
      description: "",
      subject: "",
      level: "",
      university: "",
      year: "",
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
          Upload Paper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Question Paper</DialogTitle>
          <DialogDescription>
            Share a question paper and earn {POINTS_PER_UPLOAD} points!
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
              placeholder="e.g., Mathematics Mid-Term 2024"
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
              placeholder="Brief description of the paper..."
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
              {FREE_TEXT_LEVELS.includes(formData.level) ? (
                <Input
                  placeholder="Type your subject name"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              ) : (
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
                    {schoolSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value, subject: "" })
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

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 2024"
                min="2000"
                max="2030"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
              />
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
