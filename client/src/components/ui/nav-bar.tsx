import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User, Settings, Bell, FileText, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function NavBar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <nav className="md:flex md:space-x-8">
              <a 
                href="/" 
                className={`${
                  location === "/" 
                    ? "border-gray-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </a>
              <a 
                href="/my-polls" 
                className={`${
                  location === "/my-polls" 
                    ? "border-gray-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                My Polls
              </a>
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-3 relative rounded-full" aria-label="User menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-100 text-gray-800 font-medium">
                        {user ? getInitials(user.name || user.username) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="-mr-2 flex items-center md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-100 text-gray-800 font-medium">
                            {user ? getInitials(user.name || user.username) : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="space-y-1 pt-2 pb-3">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="/" onClick={() => setIsMobileMenuOpen(false)}>
                          <Home className="mr-3 h-5 w-5" />
                          Dashboard
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="/my-polls" onClick={() => setIsMobileMenuOpen(false)}>
                          <FileText className="mr-3 h-5 w-5" />
                          My Polls
                        </a>
                      </Button>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
