import { useState } from "react";
import { Menu, X, Leaf, Map, BarChart3, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "My Fields", href: "/fields", icon: Map },
    { name: "Analysis", href: "/analysis", icon: Leaf },
    { name: "Services", href: "/consultation", icon: Settings },
  ];

  return (
    <header className="bg-background shadow-soft border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-foreground">AgroIndia</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <NavLink to="/auth">Sign In</NavLink>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <NavLink to="/services">Get Started</NavLink>
              </Button>
            </>
          )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-muted rounded-md mt-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-background"
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
              <div className="px-3 py-2 space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="hero" size="sm" className="w-full" asChild>
                  <NavLink to="/services">Get Started</NavLink>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;