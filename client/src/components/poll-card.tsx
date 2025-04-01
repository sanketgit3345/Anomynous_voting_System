import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye } from "lucide-react";
import { Poll } from "@shared/schema";
import { calculateTimeLeft, timeAgo } from "@/lib/utils";

interface PollCardProps {
  poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
  const isExpired = new Date(poll.expiresAt) < new Date();
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex-1">{poll.title}</h3>
          <Badge variant={isExpired ? "outline" : "secondary"} className="ml-2">
            {isExpired ? "Completed" : "Active"}
          </Badge>
        </div>
        
        {poll.description && (
          <p className="text-sm text-gray-500 my-3 line-clamp-2">{poll.description}</p>
        )}
        
        <div className="text-sm text-gray-500 mt-4">
          <div className="flex items-center mb-1">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            <span>Created {timeAgo(new Date(poll.createdAt))}</span>
          </div>
          <div className="mt-1">
            {isExpired ? (
              <span className="text-gray-500">Ended</span>
            ) : (
              <span className="text-green-600 font-medium">
                {calculateTimeLeft(new Date(poll.expiresAt))}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-xs text-gray-500">Options:</div>
          <ul className="ml-4 mt-1 text-sm text-gray-700">
            {(poll.options as string[]).slice(0, 3).map((option, index) => (
              <li key={index} className="list-disc">
                <span className="line-clamp-1">{option}</span>
              </li>
            ))}
            {(poll.options as string[]).length > 3 && (
              <li className="list-none text-gray-500 text-xs mt-1">
                +{(poll.options as string[]).length - 3} more options
              </li>
            )}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={`/poll/${poll.id}`} className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            View Poll
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
