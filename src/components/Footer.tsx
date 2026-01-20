import { BookOpen, Mail, Twitter, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Study Share</span>
            </a>
            <p className="text-sm opacity-70 mb-4">
              Empowering students to share knowledge and succeed together.
            </p>
            <div className="flex gap-4">
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#" className="hover:opacity-100 transition-opacity">Browse Papers</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Upload Papers</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Rewards Program</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Universities</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#" className="hover:opacity-100 transition-opacity">Study Tips</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Exam Prep Guide</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Community Forum</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                hello@studyshare.com
              </li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Support Center</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm opacity-60">
          <p>© 2024 Study Share. Made with ❤️ for students worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
