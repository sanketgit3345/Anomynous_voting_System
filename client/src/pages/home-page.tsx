import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Clock, Users, ChevronRight, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/ui/nav-bar";
import Footer from "@/components/ui/footer";
import PollCard from "@/components/poll-card";
import VotingForm from "@/components/voting-form";
import ResultsDisplay from "@/components/results-display";
import { DashboardStats, PollResult } from "@shared/types";
import { calculateTimeLeft } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Poll } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    onError: (error) => {
      toast({
        title: "Error loading statistics",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { data: recentPolls, isLoading: pollsLoading } = useQuery<Poll[]>({
    queryKey: ["/api/polls/recent"],
    onError: (error) => {
      toast({
        title: "Error loading recent polls",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { data: featuredPoll, isLoading: featuredLoading } = useQuery<PollResult>({
    queryKey: ["/api/polls/featured"],
    onError: (error) => {
      toast({
        title: "Error loading featured poll",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-medium text-gray-900">Polls</h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <a 
                href="/create-poll" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Poll
              </a>
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <div className="mt-8">
            {statsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Polls</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">{stats.totalPolls}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Polls</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">{stats.activePolls}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Votes</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">{stats.totalVotes}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Average Responses</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">{stats.avgResponses.toFixed(1)}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Failed to load statistics</p>
            )}
          </div>
          
          {/* Recent Polls List */}
          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Polls</h3>
            {pollsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : recentPolls && recentPolls.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {recentPolls.map((poll) => (
                    <li key={poll.id}>
                      <a href={`/poll/${poll.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="truncate">
                              <div className="flex">
                                <p className="text-sm font-medium text-gray-700 truncate">{poll.title}</p>
                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500 text-sm">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    new Date(poll.expiresAt) > new Date() 
                                      ? "bg-gray-200 text-gray-800" 
                                      : "bg-gray-100 text-gray-600"
                                  }`}>
                                    {new Date(poll.expiresAt) > new Date() ? "Active" : "Completed"}
                                  </span>
                                </p>
                              </div>
                              <div className="mt-2 flex">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                  <span>
                                    {`Created ${new Date(poll.createdAt).toLocaleDateString()} • ${
                                      new Date(poll.expiresAt) > new Date()
                                        ? calculateTimeLeft(new Date(poll.expiresAt))
                                        : "Ended"
                                    }`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-5 flex-shrink-0 flex items-center">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No polls found</p>
                  <a href="/create-poll" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
                    Create Your First Poll
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Featured Poll */}
          {featuredLoading ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : featuredPoll ? (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Featured Poll</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Cast your vote anonymously. Results update in real-time.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="mb-5">
                  <h4 className="text-base font-medium text-gray-900 mb-3">{featuredPoll.pollTitle}</h4>
                  
                  <VotingForm 
                    pollId={featuredPoll.pollId} 
                    options={featuredPoll.options} 
                  />
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <ResultsDisplay result={featuredPoll} />
                </div>
              </div>
            </div>
          ) : null}
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
