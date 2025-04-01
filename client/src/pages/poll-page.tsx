import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/ui/nav-bar";
import Footer from "@/components/ui/footer";
import VotingForm from "@/components/voting-form";
import ResultsDisplay from "@/components/results-display";
import { PollResult } from "@shared/types";
import { Poll } from "@shared/schema";
import { calculateTimeLeft, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PollPage() {
  const { id } = useParams<{ id: string }>();
  const pollId = parseInt(id, 10);
  const { toast } = useToast();
  
  // Get poll details
  const { data: poll, isLoading: pollLoading, error: pollError } = useQuery<Poll>({
    queryKey: [`/api/polls/${pollId}`],
    onError: (error) => {
      toast({
        title: "Error loading poll",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Get poll results
  const { data: pollResult, isLoading: resultsLoading } = useQuery<PollResult>({
    queryKey: [`/api/polls/${pollId}/results`],
    enabled: !!poll,
    onError: (error) => {
      toast({
        title: "Error loading results",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const isLoading = pollLoading || resultsLoading;
  const isExpired = poll ? new Date(poll.expiresAt) < new Date() : false;
  
  if (pollError) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center p-4">
                <p className="text-gray-600 mb-4">Poll not found or you don't have permission to view it.</p>
                <Button asChild>
                  <a href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <a href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : poll && pollResult ? (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{poll.title}</CardTitle>
                      <CardDescription>
                        Created {formatDate(new Date(poll.createdAt))}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      isExpired 
                        ? "bg-gray-100 text-gray-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {isExpired ? "Ended" : calculateTimeLeft(new Date(poll.expiresAt))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {poll.description && (
                    <p className="text-gray-700 mb-6">{poll.description}</p>
                  )}
                  
                  {!isExpired ? (
                    <VotingForm 
                      pollId={poll.id} 
                      options={poll.options as string[]} 
                    />
                  ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            This poll has ended. You can no longer submit votes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Poll results are updated in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResultsDisplay result={pollResult} />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Poll not found</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
