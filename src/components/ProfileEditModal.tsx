import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Loader2 } from "lucide-react";

interface ProfileEditModalProps {
  profile: {
    name: string;
    study_level: string | null;
    subjects_of_interest: string[] | null;
  };
  userId: string;
  onProfileUpdated: () => void;
}

const studyLevels = [
  "High School",
  "Undergraduate", 
  "Postgraduate",
  "Doctorate",
  "Professional",
  "Other"
];

const subjectOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Engineering",
  "Economics",
  "Business",
  "Literature",
  "History",
  "Psychology",
  "Law",
  "Medicine",
  "Other"
];

const ProfileEditModal = ({ profile, userId, onProfileUpdated }: ProfileEditModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile.name);
  const [studyLevel, setStudyLevel] = useState(profile.study_level || "");
  const [subjects, setSubjects] = useState<string[]>(profile.subjects_of_interest || []);
  const { toast } = useToast();

  const handleSubjectToggle = (subject: string) => {
    setSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          study_level: studyLevel || null,
          subjects_of_interest: subjects.length > 0 ? subjects : null
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      
      setOpen(false);
      onProfileUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={100}
            />
          </div>

          {/* Study Level */}
          <div className="space-y-2">
            <Label htmlFor="study-level">Study Level</Label>
            <Select value={studyLevel} onValueChange={setStudyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select your study level" />
              </SelectTrigger>
              <SelectContent>
                {studyLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subjects of Interest */}
          <div className="space-y-3">
            <Label>Subjects of Interest</Label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
              {subjectOptions.map(subject => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject}`}
                    checked={subjects.includes(subject)}
                    onCheckedChange={() => handleSubjectToggle(subject)}
                  />
                  <Label 
                    htmlFor={`subject-${subject}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {subject}
                  </Label>
                </div>
              ))}
            </div>
            {subjects.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {subjects.length} subject(s) selected
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
