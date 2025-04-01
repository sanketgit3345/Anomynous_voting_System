import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, Plus, Archive, CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "@/components/ui/nav-bar";
import Footer from "@/components/ui/footer";
import PollCard from "@/components/poll-card";
import { Poll } from "@shared/schema";
import { calculateTimeLeft } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function MyPollsPage() {
  const [tab, setTab] = useState<string>("active");
  const { toast } = useToast();
  
  const { data: myPolls, isLoading } = useQuery<Poll[]>({
    queryKey: ["/api/polls/my"],
    onError: (error) => {
      toast({
        title: "Error loading polls",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter polls based on active tab
  const filteredPolls = myPolls?.filter(poll => {
    const isExpired = new Date(poll.expiresAt) < new Date();
    if (tab === "active") return !isExpired;
    if (tab === "completed") return isExpired;
    return true; // Show all in "all" tab
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 border-b border-gray-200">
            <div className="sm:flex sm:items-baseline">
              <h3 className="text-lg leading-6 font-medium text-gray-900 sm:mr-8">Polls</h3>
              <div className="mt-4 sm:mt-0">
                <nav className="-mb-px flex space-x-8">
                  <a href="/" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">
                    Dashboard
                  </a>
                  <a href="/my-polls" className="border-indigo-500 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm" aria-current="page">
                    My Polls
                  </a>
                </nav>
              </div>
            </div>
          </div>
          
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">My Polls</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your created polls and view their results.</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button asChild>
                <a href="/create-poll">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Poll
                </a>
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="active" value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="active" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Active
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <Archive className="h-4 w-4" /> Completed
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> All Polls
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {renderPollList(filteredPolls, isLoading, "active")}
            </TabsContent>
            
            <TabsContent value="completed">
              {renderPollList(filteredPolls, isLoading, "completed")}
            </TabsContent>
            
            <TabsContent value="all">
              {renderPollList(filteredPolls, isLoading, "all")}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function renderPollList(polls: Poll[] | undefined, isLoading: boolean, tabType: string) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  
  if (!polls || polls.length === 0) {
    const message = tabType === "active" 
      ? "You don't have any active polls." 
      : tabType === "completed" 
        ? "You don't have any completed polls." 
        : "You haven't created any polls yet.";
    
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 mb-4">{message}</p>
          <Button asChild>
            <a href="/create-poll">
              <Plus className="mr-2 h-4 w-4" />
              Create New Poll
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}
