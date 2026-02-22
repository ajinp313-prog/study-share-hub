import { Upload, Star, BookOpen, ArrowRight } from "lucide-react";
import { REWARDS } from "@/constants/rewards";

const steps = [
  {
    icon: Upload,
    title: "Upload Papers",
    description: "Share your exam papers, notes, and study materials with the community.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Star,
    title: "Earn Points",
    description: `Earn ${REWARDS.PAPERS_UPLOAD} points per paper and ${REWARDS.NOTES_UPLOAD} points per note. The more you share, the more you earn!`,
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BookOpen,
    title: "Access Resources",
    description: "Use your points to unlock premium study materials, notes, and mock tests.",
    color: "bg-secondary text-secondary-foreground",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students sharing knowledge and earning rewards in 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-20 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-accent/50" />
          <div className="hidden md:block absolute top-20 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-accent/50 to-secondary/50" />

          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-8 w-8" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden mt-6 text-muted-foreground/50">
                    <ArrowRight className="h-6 w-6 rotate-90" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
