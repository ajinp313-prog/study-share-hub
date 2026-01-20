import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, LogIn, Mail, Lock, Sparkles, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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

// Validation schemas
const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Email or mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address"),
  mobile: z.string().trim().min(10, "Mobile number must be at least 10 digits").max(15, "Invalid mobile number").regex(/^[0-9+\-\s]+$/, "Invalid mobile number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  studyLevel: z.string().min(1, "Please select your study level"),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

const AuthModal = ({ open, onOpenChange, defaultTab = "signin" }: AuthModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [signInData, setSignInData] = useState({
    identifier: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    studyLevel: "",
    careerGoals: "",
  });

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signInSchema.safeParse(signInData);
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

    setIsLoading(true);

    try {
      // Check if identifier is email or phone
      const isEmail = signInData.identifier.includes("@");
      
      const { error } = await supabase.auth.signInWithPassword({
        email: isEmail ? signInData.identifier : `${signInData.identifier}@phone.local`,
        password: signInData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email/mobile or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      onOpenChange(false);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse(signUpData);
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

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signUpData.name,
            mobile: signUpData.mobile,
            study_level: signUpData.studyLevel,
            subjects_of_interest: selectedSubjects,
            career_goals: signUpData.careerGoals,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Update profile with additional info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          study_level: signUpData.studyLevel,
          subjects_of_interest: selectedSubjects,
          career_goals: signUpData.careerGoals,
        }).eq("user_id", user.id);
      }

      toast({
        title: "Account created!",
        description: "Welcome to Study Share. Start exploring papers!",
      });
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to Study Share
          </DialogTitle>
          <DialogDescription>
            Access thousands of free question papers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "signin" | "signup"); setErrors({}); }} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-identifier">Email or Mobile Number</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-identifier"
                    type="text"
                    placeholder="Email or mobile number"
                    className="pl-10"
                    value={signInData.identifier}
                    onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox id="remember" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-primary hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setActiveTab("signup"); setErrors({}); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up for free
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="signup-name"
                  placeholder="Enter your name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-mobile">Mobile Number <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      className="pl-10"
                      value={signUpData.mobile}
                      onChange={(e) => setSignUpData({ ...signUpData, mobile: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    className="pl-10"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyLevel">Study Level <span className="text-destructive">*</span></Label>
                <Select
                  value={signUpData.studyLevel}
                  onValueChange={(value) => setSignUpData({ ...signUpData, studyLevel: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your study level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10th">10th Grade / Secondary</SelectItem>
                    <SelectItem value="12th">12th Grade / Higher Secondary</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate / Bachelor's</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate / Master's</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="professional">Professional Courses</SelectItem>
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
                        id={`signup-${subject}`}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => toggleSubject(subject)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`signup-${subject}`}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="careerGoals">Future Career Goals (Optional)</Label>
                <Textarea
                  id="careerGoals"
                  placeholder="Tell us about your career aspirations..."
                  value={signUpData.careerGoals}
                  onChange={(e) => setSignUpData({ ...signUpData, careerGoals: e.target.value })}
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
                Create Free Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setActiveTab("signin"); setErrors({}); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
