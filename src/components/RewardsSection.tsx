import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Upload, Star, Gift, TrendingUp, Zap } from "lucide-react";

const rewards = [
  {
    name: "Study Notes Bundle",
    points: 100,
    icon: "📚",
    description: "Premium study notes for any subject",
  },
  {
    name: "Mock Test Access",
    points: 150,
    icon: "✍️",
    description: "Access to practice tests with answers",
  },
  {
    name: "Video Tutorials",
    points: 200,
    icon: "🎬",
    description: "1-month access to video lessons",
  },
  {
    name: "Mentorship Session",
    points: 500,
    icon: "👨‍🏫",
    description: "30-min session with a senior student",
  },
];

const howToEarn = [
  { action: "Upload a paper", points: 10, icon: Upload },
  { action: "First upload bonus", points: 20, icon: Star },
  { action: "Paper gets 50+ downloads", points: 15, icon: TrendingUp },
  { action: "Daily login streak (7 days)", points: 25, icon: Zap },
];

const RewardsSection = () => {
  return (
    <section id="rewards" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-accent text-accent-foreground text-sm font-medium mb-4">
            <Award className="h-4 w-4" />
            Rewards Program
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Share Papers, Earn Rewards
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our points system rewards you for contributing to the community. Upload papers and redeem points for study resources.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* How to Earn Points */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                How to Earn Points
              </CardTitle>
              <CardDescription>
                Simple ways to build your points balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {howToEarn.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.action}</span>
                    </div>
                    <Badge className="gradient-accent text-accent-foreground border-0">
                      +{item.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                Redeem Your Points
              </CardTitle>
              <CardDescription>
                Exchange points for study resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reward.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{reward.name}</p>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      {reward.points}
                      <Award className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="max-w-xl mx-auto gradient-hero text-primary-foreground shadow-elevated border-0">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-2">Start Earning Today!</h3>
              <p className="opacity-90 mb-6">
                Upload your first paper and get a 20-point welcome bonus.
              </p>
              <Button variant="secondary" size="lg" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Your First Paper
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RewardsSection;
