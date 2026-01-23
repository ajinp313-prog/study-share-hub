import { BookOpen, Mail, Twitter, Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Study Share</span>
            </Link>
            <p className="text-sm opacity-70 mb-4">
              Empowering students to share knowledge and succeed together.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/papers" className="hover:opacity-100 transition-opacity">Browse Papers</Link></li>
              <li><Link to="/dashboard" className="hover:opacity-100 transition-opacity">Upload Papers</Link></li>
              <li><Link to="/rewards" className="hover:opacity-100 transition-opacity">Rewards Program</Link></li>
              <li><Link to="/papers" className="hover:opacity-100 transition-opacity">Universities</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/#how-it-works" className="hover:opacity-100 transition-opacity">Study Tips</Link></li>
              <li><Link to="/papers" className="hover:opacity-100 transition-opacity">Exam Prep Guide</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Community Forum</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@studyshare.com" className="hover:opacity-100 transition-opacity">
                  hello@studyshare.com
                </a>
              </li>
              <li><Link to="/help" className="hover:opacity-100 transition-opacity">Support Center</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm opacity-60">
          <p>© {new Date().getFullYear()} Study Share. Made with ❤️ for students worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
