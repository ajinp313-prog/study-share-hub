import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Gift, Star, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const upcomingRewards = [
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

interface RewardsComingSoonProps {
  userPoints?: number;
}

const RewardsComingSoon = ({ userPoints = 0 }: RewardsComingSoonProps) => {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            <CardTitle>Rewards Store</CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/20">
            <Sparkles className="h-3 w-3" />
            Coming Soon
          </Badge>
        </div>
        <CardDescription>
          Exchange your points for exclusive study resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Points Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Points Balance</p>
                <p className="text-2xl font-bold text-foreground">{userPoints} pts</p>
              </div>
            </div>
            <Gift className="h-8 w-8 text-accent opacity-50" />
          </div>
        </div>

        {/* Upcoming Rewards Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Rewards you'll be able to redeem:
          </p>
          
          <div className="grid gap-3">
            {upcomingRewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 opacity-75 relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl grayscale">{reward.icon}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{reward.name}</p>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1 opacity-60">
                  {reward.points}
                  <Star className="h-3 w-3" />
                </Badge>
                
                {/* Overlay lock effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/50 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Notify Me Button */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="outline" className="w-full gap-2" disabled>
            <Bell className="h-4 w-4" />
            Get Notified When Available
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Keep earning points! You'll be able to redeem them soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsComingSoon;
