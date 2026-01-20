import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Filter, GraduationCap, Building2 } from "lucide-react";

const paperCategories = [
  { name: "Mathematics", count: 1245, icon: "📐" },
  { name: "Physics", count: 892, icon: "⚡" },
  { name: "Chemistry", count: 756, icon: "🧪" },
  { name: "Computer Science", count: 1102, icon: "💻" },
  { name: "Biology", count: 634, icon: "🧬" },
  { name: "Economics", count: 421, icon: "📊" },
];

const recentPapers = [
  {
    title: "Advanced Calculus - Final Exam 2024",
    university: "MIT",
    subject: "Mathematics",
    downloads: 234,
    level: "Engineering",
  },
  {
    title: "Organic Chemistry Mid-Term",
    university: "Stanford University",
    subject: "Chemistry",
    downloads: 189,
    level: "Undergraduate",
  },
  {
    title: "Data Structures & Algorithms",
    university: "IIT Delhi",
    subject: "Computer Science",
    downloads: 567,
    level: "Engineering",
  },
  {
    title: "Microeconomics Quiz Paper",
    university: "Harvard",
    subject: "Economics",
    downloads: 123,
    level: "Undergraduate",
  },
];

const BrowsePapers = () => {
  return (
    <section id="browse" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse Question Papers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find papers by subject, university, or study level. All papers are free to access.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by subject, university, or keyword..."
              className="pl-12 pr-20 h-14 text-base rounded-xl shadow-card"
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {paperCategories.map((category) => (
            <Card
              key={category.name}
              className="cursor-pointer hover:shadow-card-hover transition-all hover:-translate-y-1 border-border"
            >
              <CardContent className="p-4 text-center">
                <span className="text-3xl mb-2 block">{category.icon}</span>
                <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.count} papers</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Papers */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Recently Added</h3>
            <Button variant="ghost" className="text-primary">
              View All
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recentPapers.map((paper, index) => (
              <Card
                key={index}
                className="hover:shadow-card-hover transition-all border-border group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {paper.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Building2 className="h-4 w-4" />
                        {paper.university}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {paper.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {paper.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        Get
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                    <Download className="h-3 w-3 mr-1" />
                    {paper.downloads} downloads
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrowsePapers;
