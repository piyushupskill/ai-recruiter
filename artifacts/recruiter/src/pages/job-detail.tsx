import { useGetJob, useListApplications, getGetJobQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Briefcase, DollarSign, Clock, ArrowLeft, MoreHorizontal, UserCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export default function JobDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: job, isLoading: loadingJob } = useGetJob(id, { 
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } 
  });

  const { data: applications, isLoading: loadingApps } = useListApplications({ jobId: id });

  if (loadingJob) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        <Link href="/jobs">Back to Jobs</Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{job.title}</h1>
            <Badge variant={job.status === 'open' ? 'default' : job.status === 'closed' ? 'destructive' : 'secondary'} className="capitalize">
              {job.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.department}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
            {job.employmentType && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.employmentType}</span>}
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> 
                {job.salaryMin ? `$${(job.salaryMin/1000)}k` : '?'}-{job.salaryMax ? `$${(job.salaryMax/1000)}k` : '?'}
              </span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Opened {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Job</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
            {stages.map(stage => {
              const stageApps = applications?.filter(a => a.stage === stage) || [];
              if (stage === 'rejected' && stageApps.length === 0) return null;
              
              return (
                <div key={stage} className="min-w-[300px] w-[300px] shrink-0 snap-start">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-medium text-sm capitalize text-slate-700 dark:text-slate-300">{stage}</h3>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">{stageApps.length}</Badge>
                  </div>
                  
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-2 min-h-[400px] space-y-2">
                    {loadingApps ? (
                      <Skeleton className="h-24 w-full" />
                    ) : stageApps.length > 0 ? (
                      stageApps.map(app => (
                        <Card key={app.id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
                          <CardContent className="p-4">
                            <Link href={`/candidates/${app.candidateId}`} className="block">
                              <div className="font-medium text-sm text-slate-900 dark:text-white mb-1 truncate">
                                {app.candidate?.name || `Candidate #${app.candidateId}`}
                              </div>
                              <div className="text-xs text-slate-500 mb-3 truncate">
                                {app.candidate?.currentTitle} at {app.candidate?.currentCompany}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {app.fitScore !== null && app.fitScore !== undefined && (
                                  <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                                    <Star className="w-3 h-3 fill-current" />
                                    {app.fitScore}%
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400">
                                  {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-400">
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
