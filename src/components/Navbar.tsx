import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { TrendingUp, MessageCircle, Home, BookOpen, Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/chatbot", label: "AI Chat", icon: MessageCircle },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-sm">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Stock<span className="gradient-text">Sense</span> AI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                location.pathname === to
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="animate-slide-up border-t glass px-4 py-3 md:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "gradient-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
