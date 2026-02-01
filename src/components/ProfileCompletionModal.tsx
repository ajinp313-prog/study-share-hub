import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Phone, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Business Studies",
  "English",
  "History",
  "Geography",
];

const profileCompletionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  mobile: z.string().trim().min(10, "Mobile number must be at least 10 digits").max(15, "Invalid mobile number").regex(/^[0-9+\-\s]+$/, "Invalid mobile number format"),
  studyLevel: z.string().min(1, "Please select your study level"),
});

interface ProfileCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const ProfileCompletionModal = ({ open, onOpenChange, onComplete }: ProfileCompletionModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    studyLevel: "",
    careerGoals: "",
  });

  // Pre-fill name from Google account if available
  useEffect(() => {
    if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata.full_name || user.user_metadata.name || ""
      }));
    }
  }, [user]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileCompletionSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update the profile with the completed information
      const { error } = await supabase.from("profiles").update({
        name: formData.name,
        mobile: formData.mobile,
        study_level: formData.studyLevel,
        subjects_of_interest: selectedSubjects,
        career_goals: formData.careerGoals,
      }).eq("user_id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to Study Share. Start exploring papers!",
      });
      
      onOpenChange(false);
      onComplete?.();
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Prevent closing the modal without completing profile
      if (!isOpen) {
        toast({
          title: "Profile Required",
          description: "Please complete your profile to continue.",
          variant: "destructive",
        });
        return;
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please provide your details to access Study Share features
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="profile-name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-mobile">Mobile Number <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="profile-mobile"
                type="tel"
                placeholder="+91 9876543210"
                className="pl-10"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-studyLevel">Study Level <span className="text-destructive">*</span></Label>
            <Select
              value={formData.studyLevel}
              onValueChange={(value) => setFormData({ ...formData, studyLevel: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your study level" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="10th">10th Grade / Secondary</SelectItem>
                <SelectItem value="+1">+1 / 11th Grade</SelectItem>
                <SelectItem value="+2">+2 / 12th Grade</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate / Bachelor's</SelectItem>
                <SelectItem value="Graduate">Graduate</SelectItem>
                <SelectItem value="Masters">Postgraduate / Master's</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="PhD">PhD / Doctoral</SelectItem>
              </SelectContent>
            </Select>
            {errors.studyLevel && <p className="text-sm text-destructive">{errors.studyLevel}</p>}
          </div>

          <div className="space-y-3">
            <Label>Subjects of Interest</Label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={`profile-${subject}`}
                    checked={selectedSubjects.includes(subject)}
                    onCheckedChange={() => toggleSubject(subject)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`profile-${subject}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {subject}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-careerGoals">Future Career Goals (Optional)</Label>
            <Textarea
              id="profile-careerGoals"
              placeholder="Tell us about your career aspirations..."
              value={formData.careerGoals}
              onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Complete Profile & Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;
