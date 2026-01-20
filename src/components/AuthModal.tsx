import { useState } from "react";
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
import { UserPlus, LogIn, Mail, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

const AuthModal = ({ open, onOpenChange, defaultTab = "signin" }: AuthModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
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

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign in:", signInData);
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
    onOpenChange(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign up:", { ...signUpData, subjects: selectedSubjects });
    toast({
      title: "Account created!",
      description: "Welcome to PaperShare. Start exploring papers!",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to PaperShare
          </DialogTitle>
          <DialogDescription>
            Access thousands of free question papers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="mt-4">
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
                <Label htmlFor="signin-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
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
                  />
                </div>
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

              <Button type="submit" size="lg" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your name"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyLevel">Study Level</Label>
                <Select
                  value={signUpData.studyLevel}
                  onValueChange={(value) => setSignUpData({ ...signUpData, studyLevel: value })}
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
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Create Free Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
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
