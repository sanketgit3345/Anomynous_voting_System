import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/ui/nav-bar";
import Footer from "@/components/ui/footer";
import { insertPollSchema, InsertPoll } from "@shared/schema";

// Define a schema that extends the insertPollSchema but with some extra validation
const createPollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  options: z.array(z.string().min(1, "Option text is required")).min(2, "At least 2 options are required"),
  expireDays: z.string(),
  isAnonymized: z.boolean().default(true),
});

type CreatePollFormValues = z.infer<typeof createPollSchema>;

export default function CreatePollPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: "",
      description: "",
      options: ["", ""],
      expireDays: "3",
      isAnonymized: true,
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
      setLocation(`/poll/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create poll",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreatePollFormValues) => {
    // Filter out any empty options
    const filteredOptions = data.options.filter(option => option.trim() !== "");
    
    if (filteredOptions.length < 2) {
      toast({
        title: "Validation error",
        description: "At least 2 valid options are required",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(data.expireDays, 10));
    
    const pollData: InsertPoll = {
      title: data.title,
      description: data.description,
      options: filteredOptions,
      expiresAt: expiresAt.toISOString(), // Convert to ISO string explicitly
      isAnonymized: data.isAnonymized
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
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <a href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create a New Poll</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <FormDescription className="mb-2">
                      Add at least 2 options for people to choose from
                    </FormDescription>
                    
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
                      <FormMessage>{form.formState.errors.options.message}</FormMessage>
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="expireDays"
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
                  
                  <FormField
                    control={form.control}
                    name="isAnonymized"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enhanced Anonymity
                          </FormLabel>
                          <FormDescription>
                            Add subtle randomization to results to further protect voter privacy
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPollMutation.isPending}
                    >
                      {createPollMutation.isPending ? (
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
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
