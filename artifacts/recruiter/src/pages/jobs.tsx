import { useListJobs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Search, Plus, MapPin, Building2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function JobsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: jobs, isLoading } = useListJobs();

  const filteredJobs = jobs?.filter(job => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (search && !job.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage all your open requisitions.</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search jobs..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'draft', 'closed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredJobs?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No jobs found</h3>
            <p className="text-slate-500 mt-1 mb-4">Try adjusting your filters or create a new job posting.</p>
            <Button asChild variant="outline">
              <Link href="/jobs/new">Post a Job</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs?.map((job) => (
            <Card key={job.id} className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link href={`/jobs/${job.id}`} className="text-xl font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors truncate">
                      {job.title}
                    </Link>
                    <Badge variant={job.status === 'open' ? 'default' : job.status === 'closed' ? 'destructive' : 'secondary'} className="capitalize">
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {job.department}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    {job.employmentType && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {job.employmentType}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center px-4">
                    <div className="font-semibold text-xl text-slate-900 dark:text-white">{job.applicantCount || 0}</div>
                    <div className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Candidates
                    </div>
                  </div>
                  <Button asChild variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/jobs/${job.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
