import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { encryptVote } from "@/lib/encryption";
import { useAuth } from "@/hooks/use-auth";

const voteSchema = z.object({
  optionIndex: z.string().min(1, "Please select an option"),
});

type VoteFormValues = z.infer<typeof voteSchema>;

interface VotingFormProps {
  pollId: number;
  options: string[];
}

export default function VotingForm({ pollId, options }: VotingFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  
  const form = useForm<VoteFormValues>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      optionIndex: "",
    },
  });
  
  // Check if user has already voted
  const { data: userVote, isLoading: checkingVote } = useQuery<{ hasVoted: boolean }>({
    queryKey: [`/api/polls/${pollId}/user-vote`],
    onSuccess: (data) => {
      if (data.hasVoted) {
        setHasVoted(true);
      }
    },
    onError: (error) => {
      console.error("Error checking if user has voted:", error);
    }
  });
  
  const voteMutation = useMutation({
    mutationFn: async (data: { pollId: number; optionIndex: number; encryptedData?: string }) => {
      const res = await apiRequest("POST", "/api/votes", data);
      return await res.json();
    },
    onSuccess: () => {
      setHasVoted(true);
      toast({
        title: "Vote submitted",
        description: "Your anonymous vote has been recorded",
      });
      // Refresh results
      queryClient.invalidateQueries({ queryKey: [`/api/polls/${pollId}/results`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: VoteFormValues) => {
    const optionIndex = parseInt(data.optionIndex, 10);
    
    // Basic encryption for anonymity
    const encryptedData = user ? encryptVote(user.id, pollId, optionIndex) : undefined;
    
    voteMutation.mutate({
      pollId,
      optionIndex,
      encryptedData
    });
  };
  
  if (checkingVote) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-green-700">
              Thank you for voting! Your anonymous vote has been recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="optionIndex"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Please select one option:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="space-y-2"
                >
                  {options.map((option, index) => (
                    <FormItem 
                      key={index} 
                      className="flex items-center space-x-3 space-y-0"
                    >
                      <FormControl>
                        <RadioGroupItem value={index.toString()} />
                      </FormControl>
                      <FormLabel className="font-medium text-gray-700">
                        {option}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={voteMutation.isPending}
        >
          {voteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting
            </>
          ) : (
            "Submit Vote"
          )}
        </Button>
      </form>
    </Form>
  );
}
