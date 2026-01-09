import { Button } from "@/components/ui/button";
import { MapPin, Phone, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              RoadRescue
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/#services" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Services
            </a>
            <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How It Works
            </a>
            <a href="/#testimonials" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Testimonials
            </a>
            <a href="/#contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2">
              <Phone className="w-4 h-4" />
              <span>1-800-ROAD</span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/my-requests")}>
                    <User className="w-4 h-4 mr-2" />
                    My Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
            
            <Button variant="hero" size="default" onClick={() => navigate("/request")}>
              Get Help Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-4">
              <a href="/#services" className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Services
              </a>
              <a href="/#how-it-works" className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </a>
              <a href="/#testimonials" className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Testimonials
              </a>
              <a href="/#contact" className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Contact
              </a>
              
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => { setIsMenuOpen(false); navigate("/my-requests"); }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Requests
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => { setIsMenuOpen(false); navigate("/auth"); }}
                >
                  Sign In
                </Button>
              )}
              
              <Button variant="hero" className="mt-2" onClick={() => { setIsMenuOpen(false); navigate("/request"); }}>
                Get Help Now
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
