import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function JobsList() {
  const { data: jobs, isLoading } = useListJobs({
    query: { queryKey: getListJobsQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-2">Manage open positions and track candidate rankings.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="font-mono">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="border-border/50 hover-elevate cursor-pointer transition-colors group">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono font-bold text-lg group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <Badge variant={job.status === 'Open' ? 'default' : 'secondary'} className="font-mono text-xs">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {job.department || 'General'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(job.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {job.candidateCount || 0} candidates
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap max-w-sm">
                    {job.requiredSkills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="bg-background">
                        {skill}
                      </Badge>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-lg bg-card">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-mono font-bold">No jobs found</h3>
            <p className="text-muted-foreground mb-6">Create a job to start ranking candidates.</p>
            <Link href="/jobs/new">
              <Button variant="outline" className="font-mono">
                Create First Job
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
