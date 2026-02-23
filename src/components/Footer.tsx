import { BookOpen, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
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
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/catalog" className="hover:opacity-100 transition-opacity">Course Catalog</Link></li>
              <li><Link to="/papers" className="hover:opacity-100 transition-opacity">Browse Papers</Link></li>
              <li><Link to="/notes" className="hover:opacity-100 transition-opacity">Browse Notes</Link></li>
              <li><Link to="/rewards" className="hover:opacity-100 transition-opacity">Rewards Program</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/help" className="hover:opacity-100 transition-opacity">Help & Support</Link></li>
              <li><Link to="/dashboard" className="hover:opacity-100 transition-opacity">Dashboard</Link></li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@studyshare.com" className="hover:opacity-100 transition-opacity">
                  hello@studyshare.com
                </a>
              </li>
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
