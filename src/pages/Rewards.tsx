import { useEffect, useState } from "react";
import { REWARDS } from "@/constants/rewards";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Gift, Star, Sparkles, Bell, ArrowLeft, BookOpen, PenTool, Video, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const upcomingRewards = [
  {
    name: "Study Notes Bundle",
    points: 100,
    icon: BookOpen,
    description: "Premium study notes for any subject of your choice",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Mock Test Access",
    points: 150,
    icon: PenTool,
    description: "Access to practice tests with detailed answers and explanations",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    name: "Video Tutorials",
    points: 200,
    icon: Video,
    description: "1-month unlimited access to video lessons and tutorials",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    name: "Mentorship Session",
    points: 500,
    icon: Users,
    description: "30-minute one-on-one session with a senior student or tutor",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const Rewards = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPoints = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setUserPoints(data.points);
        }
      }
    };

    fetchPoints();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-accent/10 mb-4">
            <Award className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Rewards Store
          </h1>
          <div className="inline-flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/20 text-sm py-1 px-3">
              <Sparkles className="h-4 w-4" />
              Coming Soon
            </Badge>
          </div>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            We're working hard to bring you amazing rewards. Keep earning points by uploading papers 
            and contributing to the community!
          </p>
        </div>

        {/* Points Balance Card */}
        <Card className="max-w-md mx-auto mb-10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Points Balance</p>
                  <p className="text-3xl font-bold text-foreground">{userPoints} pts</p>
                </div>
              </div>
              <Gift className="h-10 w-10 text-accent opacity-40" />
            </div>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            Rewards You'll Be Able to Redeem
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingRewards.map((reward, index) => (
              <Card 
                key={index} 
                className="relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity cursor-not-allowed"
              >
                <CardHeader className="pb-3">
                  <div className={`p-3 rounded-xl ${reward.bgColor} w-fit mb-2`}>
                    <reward.icon className={`h-6 w-6 ${reward.color}`} />
                  </div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {reward.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1">
                      {reward.points}
                      <Star className="h-3 w-3" />
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Locked
                    </Badge>
                  </div>
                </CardContent>
                
                {/* Locked Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </Card>
            ))}
          </div>
        </div>

        {/* Notify Section */}
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Get Notified When Available
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              We'll let you know as soon as the rewards store is open. 
              Keep earning points in the meantime!
            </p>
            <Button variant="outline" className="gap-2" disabled>
              <Bell className="h-4 w-4" />
              Notify Me
            </Button>
          </CardContent>
        </Card>

        {/* Earn More Points */}
        <div className="mt-10 text-center">
          <p className="text-muted-foreground mb-4">
            Want to earn more points?
          </p>
          <Button onClick={() => navigate("/papers")} className="gap-2">
            <Gift className="h-4 w-4" />
            Upload Papers & Earn {REWARDS.PAPERS_UPLOAD} Points Each
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Rewards;
