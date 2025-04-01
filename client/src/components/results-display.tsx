import { useState, useEffect } from "react";
import { InfoIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PollResult } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { WebSocketMessage } from "@shared/types";

interface ResultsDisplayProps {
  result: PollResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const { toast } = useToast();
  const [localResult, setLocalResult] = useState<PollResult>(result);
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      // Subscribe to updates for this specific poll
      socket.send(JSON.stringify({ type: 'subscribe', pollId: result.pollId }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'vote' && message.data.pollId === result.pollId) {
          setLocalResult(message.data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return () => {
      socket.close();
    };
  }, [result.pollId]);
  
  // Also periodically poll for updates as a fallback
  const { data: latestResults } = useQuery<PollResult>({
    queryKey: [`/api/polls/${result.pollId}/results`],
    refetchInterval: 10000, // Refresh every 10 seconds
    onError: (error) => {
      console.error("Error fetching latest results:", error);
    },
    initialData: result
  });
  
  // Use WebSocket updates or fallback to polling updates
  useEffect(() => {
    if (latestResults) {
      setLocalResult(latestResults);
    }
  }, [latestResults]);
  
  return (
    <div>
      <h4 className="text-base font-medium text-gray-900 mb-3">Current Results</h4>
      <p className="text-sm text-gray-500 mb-5">Total votes: {localResult.stats.totalVotes}</p>
      
      <div className="space-y-4">
        {localResult.options.map((option, index) => {
          const voteCount = localResult.stats.optionCounts[index] || 0;
          const percentage = localResult.stats.optionPercentages[index] || 0;
          const isWinning = localResult.stats.winningIndex === index;
          
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-700">{option}</div>
                <div className={`text-sm font-medium ${isWinning ? "text-emerald-600 font-bold" : "text-gray-700"}`}>
                  {percentage.toFixed(0)}%
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ width: `${percentage}%` }} 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    isWinning ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {voteCount} vote{voteCount !== 1 ? "s" : ""} 
                {isWinning && localResult.stats.totalVotes > 0 && (
                  <span className="text-emerald-600 font-medium ml-1">(winning)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {localResult.result?.isAnonymized && (
        <p className="text-xs text-gray-500 mt-4 flex items-center">
          <InfoIcon className="h-4 w-4 text-gray-400 mr-1" />
          Results include randomized votes (±5%) to enhance privacy. Your vote remains anonymous.
        </p>
      )}
    </div>
  );
}

// Loading skeleton for results
export function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-5" />
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      
      <Skeleton className="h-3 w-full mt-4" />
    </div>
  );
}
