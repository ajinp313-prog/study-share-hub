import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Sparkles } from "lucide-react";

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

const RegistrationForm = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ ...formData, subjects: selectedSubjects });
    // Handle form submission
  };

  return (
    <section id="register" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Join 5,000+ Students
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Create Your Free Account
            </h2>
            <p className="text-muted-foreground">
              Get personalized paper recommendations and start earning rewards
            </p>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Student Registration
              </CardTitle>
              <CardDescription>
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyLevel">Study Level</Label>
                  <Select
                    value={formData.studyLevel}
                    onValueChange={(value) => setFormData({ ...formData, studyLevel: value })}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subjects.map((subject) => (
                      <div
                        key={subject}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={subject}
                          checked={selectedSubjects.includes(subject)}
                          onCheckedChange={() => toggleSubject(subject)}
                        />
                        <label
                          htmlFor={subject}
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
                    value={formData.careerGoals}
                    onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Free Account
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
