import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperUpload } from "@/components/PaperUpload";
import RewardsComingSoon from "@/components/RewardsComingSoon";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Award, 
  FileText, 
  TrendingUp, 
  Star,
  Clock,
  Download,
  Upload
} from "lucide-react";

interface Profile {
  name: string;
  study_level: string | null;
  subjects_of_interest: string[] | null;
  points: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, study_level, subjects_of_interest, points")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    { label: "Papers Downloaded", value: "0", icon: Download, color: "text-blue-500" },
    { label: "Papers Uploaded", value: "0", icon: Upload, color: "text-green-500" },
    { label: "Points Earned", value: String(profile?.points || 0), icon: Star, color: "text-yellow-500" },
    { label: "Days Active", value: "1", icon: Clock, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.name || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.study_level 
              ? `${profile.study_level} Student`
              : "Ready to explore question papers?"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Browse Papers</CardTitle>
                  <CardDescription>Find question papers by subject</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/papers")}
              >
                Start Browsing
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Upload className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload Paper</CardTitle>
                  <CardDescription>Share & earn 50 points</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PaperUpload />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Rewards
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      Coming Soon
                    </span>
                  </CardTitle>
                  <CardDescription>Redeem your earned points</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                View Rewards
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Coming Soon */}
        <div className="mb-8">
          <RewardsComingSoon userPoints={profile?.points || 0} />
        </div>

        {/* Recent Activity / Recommended */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended for You
              </CardTitle>
              <CardDescription>Based on your interests</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.subjects_of_interest && profile.subjects_of_interest.length > 0 ? (
                <div className="space-y-3">
                  {profile.subjects_of_interest.slice(0, 3).map((subject, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{subject} Papers</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Complete your profile to get personalized recommendations.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Downloads
              </CardTitle>
              <CardDescription>Papers you've accessed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No downloads yet</p>
                <p className="text-xs">Start exploring papers to see them here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
