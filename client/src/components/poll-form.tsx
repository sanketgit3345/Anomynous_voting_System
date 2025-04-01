import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { InsertPoll } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const pollFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  options: z.array(z.string().min(1, "Option text is required")).min(2, "At least 2 options are required"),
  expiryDays: z.string(),
});

type PollFormValues = z.infer<typeof pollFormSchema>;

interface PollFormProps {
  onSuccess?: (pollId: number) => void;
}

export default function PollForm({ onSuccess }: PollFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      options: ["", ""],
      expiryDays: "3",
    },
  });
  
  const createPollMutation = useMutation({
    mutationFn: async (data: InsertPoll) => {
      const res = await apiRequest("POST", "/api/polls", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Poll created",
        description: "Your poll has been created successfully",
      });
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create poll",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  const onSubmit = (data: PollFormValues) => {
    setIsSubmitting(true);
    
    // Filter out any empty options
    const filteredOptions = data.options.filter(option => option.trim() !== "");
    
    if (filteredOptions.length < 2) {
      toast({
        title: "Validation error",
        description: "At least 2 valid options are required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(data.expiryDays, 10));
    
    const pollData: InsertPoll = {
      title: data.title,
      description: data.description,
      options: filteredOptions,
      expiresAt,
      isAnonymized: true // Default to anonymized
    };
    
    createPollMutation.mutate(pollData);
  };
  
  const addOption = () => {
    const currentOptions = form.getValues("options");
    form.setValue("options", [...currentOptions, ""]);
  };
  
  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options");
    if (currentOptions.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }
    form.setValue("options", currentOptions.filter((_, i) => i !== index));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poll Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="What do you want to ask?" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide more details about your poll..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel className="block mb-2">Poll Options</FormLabel>
          <p className="text-sm text-gray-500 mb-2">Add at least 2 options for people to choose from</p>
          
          <div className="space-y-3">
            {form.watch("options").map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`options.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1 mb-0">
                      <FormControl>
                        <Input 
                          placeholder={`Option ${index + 1}`} 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="mt-3"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
          
          {form.formState.errors.options && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.options.message}
            </p>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="expiryDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poll Duration</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Creating
              </>
            ) : (
              "Create Poll"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
