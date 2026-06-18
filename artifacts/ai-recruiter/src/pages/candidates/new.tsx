import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCandidate } from "@workspace/api-client-react";
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
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  currentTitle: z.string().min(1, "Current title is required"),
  currentCompany: z.string().optional(),
  yearsExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  education: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  summary: z.string().optional(),
  openToRemote: z.boolean().default(false),
  availabilityWeeks: z.coerce.number().optional(),
  expectedSalary: z.coerce.number().optional(),
  activityScore: z.coerce.number().min(0).max(100).optional(),
  responseRate: z.coerce.number().min(0).max(100).optional(),
  careerProgression: z.string().optional(),
  notableAchievements: z.array(z.string()).optional().default([]),
});

export default function NewCandidate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCandidate = useCreateCandidate();
  
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentAchievement, setCurrentAchievement] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      currentTitle: "",
      currentCompany: "",
      yearsExperience: 0,
      skills: [],
      education: "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      summary: "",
      openToRemote: false,
      availabilityWeeks: 2,
      expectedSalary: 0,
      activityScore: 50,
      responseRate: 50,
      careerProgression: "Steady",
      notableAchievements: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCandidate.mutate(
      { data: values },
      {
        onSuccess: (candidate) => {
          toast({ title: "Candidate Added", description: "Successfully added new candidate." });
          setLocation(`/candidates/${candidate.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to add candidate." });
        }
      }
    );
  };

  const handleAddArrayItem = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "skills" | "notableAchievements",
    currentValue: string,
    setCurrentValue: (val: string) => void
  ) => {
    if (e.key === "Enter" && currentValue.trim()) {
      e.preventDefault();
      const currentItems = form.getValues(field) || [];
      if (!currentItems.includes(currentValue.trim())) {
        form.setValue(field, [...currentItems, currentValue.trim()], { shouldValidate: true });
      }
      setCurrentValue("");
    }
  };

  const handleRemoveArrayItem = (field: "skills" | "notableAchievements", itemToRemove: string) => {
    const currentItems = form.getValues(field) || [];
    form.setValue(
      field,
      currentItems.filter((i) => i !== itemToRemove),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/candidates">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Add Candidate</h1>
          <p className="text-muted-foreground mt-1">Enter candidate profile details and behavioral signals.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Email</FormLabel><FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currentTitle" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Current Title</FormLabel><FormControl><Input placeholder="Senior Engineer" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currentCompany" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Current Company</FormLabel><FormControl><Input placeholder="Tech Corp" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="yearsExperience" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Years of Experience</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Location</FormLabel><FormControl><Input placeholder="New York, NY" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="skills" render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel className="font-mono">Skills (Press Enter to add)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => handleAddArrayItem(e, "skills", currentSkill, setCurrentSkill)} placeholder="e.g. React, TypeScript, Node.js" />
                    <div className="flex flex-wrap gap-2">
                      {field.value?.map((skill) => (
                        <Badge key={skill} variant="default" className="font-mono flex items-center gap-1">
                          {skill} <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveArrayItem("skills", skill)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notableAchievements" render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel className="font-mono">Notable Achievements (Press Enter to add)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input value={currentAchievement} onChange={(e) => setCurrentAchievement(e.target.value)} onKeyDown={(e) => handleAddArrayItem(e, "notableAchievements", currentAchievement, setCurrentAchievement)} placeholder="e.g. Led migration to microservices" />
                    <div className="flex flex-wrap gap-2">
                      {field.value?.map((achievement) => (
                        <Badge key={achievement} variant="outline" className="font-mono flex items-center gap-1">
                          {achievement} <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveArrayItem("notableAchievements", achievement)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="summary" render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel className="font-mono">Summary</FormLabel>
                <FormControl><Textarea className="min-h-[100px]" placeholder="Candidate bio/summary..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            <h3 className="col-span-full font-mono text-lg font-bold">Links & Availability</h3>
            <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">LinkedIn URL</FormLabel><FormControl><Input type="url" placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="githubUrl" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">GitHub URL</FormLabel><FormControl><Input type="url" placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="expectedSalary" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Expected Salary (USD)</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="availabilityWeeks" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Availability (Weeks)</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="openToRemote" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-card col-span-full md:col-span-1">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-mono">Open to Remote</FormLabel>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            <h3 className="col-span-full font-mono text-lg font-bold">Behavioral Signals</h3>
            <FormField control={form.control} name="activityScore" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Activity Score (0-100)</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="responseRate" render={({ field }) => (
              <FormItem><FormLabel className="font-mono">Response Rate (0-100)</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="careerProgression" render={({ field }) => (
              <FormItem className="col-span-full md:col-span-1">
                <FormLabel className="font-mono">Career Progression</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select progression" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Rapid">Rapid</SelectItem>
                    <SelectItem value="Steady">Steady</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6">
            <Link href="/candidates">
              <Button variant="outline" type="button" className="font-mono">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createCandidate.isPending} className="font-mono">
              {createCandidate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Candidate
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
