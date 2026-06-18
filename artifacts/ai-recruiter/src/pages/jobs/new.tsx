import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateJob } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  department: z.string().optional(),
  requiredSkills: z.array(z.string()).min(1, "At least one required skill is needed"),
  niceToHaveSkills: z.array(z.string()).optional().default([]),
  minYearsExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
  seniorityLevel: z.string().min(1, "Seniority level is required"),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  remotePolicy: z.string().optional(),
  status: z.string().optional().default("Open"),
});

export default function NewJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createJob = useCreateJob();
  
  const [currentRequiredSkill, setCurrentRequiredSkill] = useState("");
  const [currentNiceToHaveSkill, setCurrentNiceToHaveSkill] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      requiredSkills: [],
      niceToHaveSkills: [],
      minYearsExperience: 0,
      seniorityLevel: "",
      employmentType: "",
      location: "",
      remotePolicy: "",
      status: "Open",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createJob.mutate(
      { data: values },
      {
        onSuccess: (job) => {
          toast({ title: "Job Created", description: "Successfully created new job posting." });
          setLocation(`/jobs/${job.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to create job." });
        }
      }
    );
  };

  const handleAddSkill = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "requiredSkills" | "niceToHaveSkills",
    currentValue: string,
    setCurrentValue: (val: string) => void
  ) => {
    if (e.key === "Enter" && currentValue.trim()) {
      e.preventDefault();
      const currentSkills = form.getValues(field) || [];
      if (!currentSkills.includes(currentValue.trim())) {
        form.setValue(field, [...currentSkills, currentValue.trim()], { shouldValidate: true });
      }
      setCurrentValue("");
    }
  };

  const handleRemoveSkill = (field: "requiredSkills" | "niceToHaveSkills", skillToRemove: string) => {
    const currentSkills = form.getValues(field) || [];
    form.setValue(
      field,
      currentSkills.filter((s) => s !== skillToRemove),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Create Job</h1>
          <p className="text-muted-foreground mt-1">Define the role and requirements to start ranking candidates.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="col-span-full md:col-span-1">
                  <FormLabel className="font-mono">Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel className="font-mono">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter detailed job description..." 
                      className="min-h-[150px] resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skills */}
            <FormField
              control={form.control}
              name="requiredSkills"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel className="font-mono">Required Skills (Press Enter to add)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        placeholder="e.g. React"
                        value={currentRequiredSkill}
                        onChange={(e) => setCurrentRequiredSkill(e.target.value)}
                        onKeyDown={(e) => handleAddSkill(e, "requiredSkills", currentRequiredSkill, setCurrentRequiredSkill)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((skill) => (
                          <Badge key={skill} variant="default" className="font-mono flex items-center gap-1">
                            {skill}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                              onClick={() => handleRemoveSkill("requiredSkills", skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="niceToHaveSkills"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel className="font-mono">Nice-to-Have Skills (Press Enter to add)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        placeholder="e.g. GraphQL"
                        value={currentNiceToHaveSkill}
                        onChange={(e) => setCurrentNiceToHaveSkill(e.target.value)}
                        onKeyDown={(e) => handleAddSkill(e, "niceToHaveSkills", currentNiceToHaveSkill, setCurrentNiceToHaveSkill)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((skill) => (
                          <Badge key={skill} variant="outline" className="font-mono flex items-center gap-1">
                            {skill}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                              onClick={() => handleRemoveSkill("niceToHaveSkills", skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minYearsExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Min Years Experience</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seniorityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Seniority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Entry">Entry</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remotePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Remote Policy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6">
            <Link href="/jobs">
              <Button variant="outline" type="button" className="font-mono">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createJob.isPending} className="font-mono">
              {createJob.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
