import { useState, useEffect } from "react";
import { lovable } from "@/integrations/lovable/index";
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
import { UserPlus, LogIn, Mail, Lock, Sparkles, Phone, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  
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

  // Check if user needs to complete profile after Google sign-in
  useEffect(() => {
    const checkProfileCompletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("mobile, study_level")
          .eq("user_id", user.id)
          .single();

        // If profile is incomplete (no mobile or study level), show completion modal
        if (profile && (!profile.mobile || !profile.study_level)) {
          setShowProfileCompletion(true);
        }
      }
    };

    // Listen for auth state changes to detect Google sign-in completion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Reset Google loading state when sign-in completes
          setIsGoogleLoading(false);
          
          // Check if this is a new Google sign-in user that needs profile completion
          setTimeout(async () => {
            await checkProfileCompletion();
          }, 500);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsGoogleLoading(false);
        return;
      }

      // Auth state change listener will handle profile completion check
      toast({
        title: "Welcome!",
        description: "Redirecting to Google...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
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
      let emailToUse = signInData.identifier;
      
      // If it's a phone number, look up the email using RPC function (bypasses RLS)
      if (!isEmail) {
        const cleanedMobile = signInData.identifier.replace(/[\s\-]/g, "");
        
        // Use the SECURITY DEFINER RPC function to get email by mobile
        const { data: emailResult, error: rpcError } = await supabase
          .rpc('get_user_email_by_mobile', { mobile_number: cleanedMobile });
          
        if (rpcError || !emailResult || emailResult.length === 0) {
          toast({
            title: "Login failed",
            description: "No account found with this mobile number. Please check and try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // The RPC returns a table, get the first row's email
        emailToUse = emailResult[0].email;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!forgotPasswordEmail.trim() || !forgotPasswordEmail.includes("@")) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. Please check your inbox.",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
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

  // Google Icon as inline SVG to avoid ref issues
  const googleIconSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) setShowForgotPassword(false); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {showForgotPassword ? "Reset Password" : "Welcome to Study Share"}
            </DialogTitle>
            <DialogDescription>
              {showForgotPassword 
                ? "Enter your email to receive a password reset link" 
                : "Access thousands of free question papers"}
            </DialogDescription>
          </DialogHeader>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.forgotEmail && <p className="text-sm text-destructive">{errors.forgotEmail}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Reset Link
              </Button>

              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setErrors({}); setForgotPasswordEmail(""); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </form>
          ) : (

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
              <div className="space-y-4">
                {/* Google Sign-In Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 border-border hover:bg-secondary/50"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    googleIconSvg
                  )}
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>

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
                        disabled={isLoading || isGoogleLoading}
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
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        disabled={isLoading || isGoogleLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox id="remember" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setErrors({}); }}
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading || isGoogleLoading}>
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
              </div>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-6">
              <div className="space-y-4">
                {/* Google Sign-Up Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 border-border hover:bg-secondary/50"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    googleIconSvg
                  )}
                  Sign up with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or sign up with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your name"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                      disabled={isLoading || isGoogleLoading}
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
                          disabled={isLoading || isGoogleLoading}
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
                          disabled={isLoading || isGoogleLoading}
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
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        className="pl-10 pr-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                        disabled={isLoading || isGoogleLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={signUpData.password} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studyLevel">Study Level <span className="text-destructive">*</span></Label>
                    <Select
                      value={signUpData.studyLevel}
                      onValueChange={(value) => setSignUpData({ ...signUpData, studyLevel: value })}
                      disabled={isLoading || isGoogleLoading}
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
                            id={`signup-${subject}`}
                            checked={selectedSubjects.includes(subject)}
                            onCheckedChange={() => toggleSubject(subject)}
                            disabled={isLoading || isGoogleLoading}
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
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading || isGoogleLoading}>
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
              </div>
            </TabsContent>
          </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Completion Modal for Google Sign-In users */}
      <ProfileCompletionModal
        open={showProfileCompletion}
        onOpenChange={setShowProfileCompletion}
        onComplete={() => {
          onOpenChange(false);
        }}
      />
    </>
  );
};

export default AuthModal;
