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
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-indigo-600">VoteSafe</span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <a 
                href="/" 
                className={`${
                  location === "/" 
                    ? "border-indigo-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </a>
              <a 
                href="/my-polls" 
                className={`${
                  location === "/my-polls" 
                    ? "border-indigo-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                My Polls
              </a>
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5 text-gray-500" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-3 relative rounded-full" aria-label="User menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-indigo-100 text-indigo-800 font-medium">
                        {user ? getInitials(user.name || user.username) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user && (
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500 mt-1">{user.username}</p>
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                          <AvatarFallback className="bg-indigo-100 text-indigo-800 font-medium">
                            {user ? getInitials(user.name || user.username) : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user?.name || user?.username || "Guest"}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {user?.username}
                        </div>
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
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-3 h-5 w-5" />
                          Your Profile
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-3 h-5 w-5" />
                          Settings
                        </Button>
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
