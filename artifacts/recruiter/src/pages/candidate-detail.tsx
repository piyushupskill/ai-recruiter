import { useGetCandidate, useListApplications, getGetCandidateQueryKey, useUpdateApplication } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, Briefcase, Github, Linkedin, ArrowLeft, Star, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { EmailTemplatesPanel } from "@/components/email-templates-panel";
import { CvScreeningPanel } from "@/components/cv-screening-panel";

const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export default function CandidateDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidate, isLoading: loadingCandidate } = useGetCandidate(id, { 
    query: { enabled: !!id, queryKey: getGetCandidateQueryKey(id) } 
  });

  const { data: applications, isLoading: loadingApps } = useListApplications({ candidateId: id });
  const updateApplication = useUpdateApplication();

  const handleStageChange = (appId: number, newStage: string) => {
    updateApplication.mutate(
      { id: appId, data: { stage: newStage as any } },
      {
        onSuccess: () => {
          toast({ title: "Stage updated" });
          queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        },
        onError: (err) => {
          toast({ title: "Failed to update stage", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (loadingCandidate) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-8 flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) return <div>Candidate not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        <Link href="/candidates">Back to Candidates</Link>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 border-b">
            <Avatar className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-950 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-2xl">
                {candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{candidate.name}</h1>
                <div className="flex gap-2">
                  {candidate.linkedinUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4 mr-2" /> LinkedIn</a>
                    </Button>
                  )}
                  {candidate.githubUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={candidate.githubUrl} target="_blank" rel="noreferrer"><Github className="w-4 h-4 mr-2" /> GitHub</a>
                    </Button>
                  )}
                  <Button size="sm">Edit Profile</Button>
                </div>
              </div>
              
              <div className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                {candidate.currentTitle} {candidate.currentCompany && `at ${candidate.currentCompany}`}
                {!candidate.currentTitle && !candidate.currentCompany && "No current role specified"}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {candidate.email}</span>
                {candidate.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {candidate.phone}</span>}
                {candidate.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {candidate.location}</span>}
              </div>
            </div>
          </div>
          
          {candidate.tags && candidate.tags.length > 0 && (
            <div className="px-8 py-4 bg-white dark:bg-slate-950 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Tags</span>
              {candidate.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="font-medium bg-slate-100">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Active Applications</h2>
          
          {loadingApps ? (
            <Skeleton className="h-32 w-full" />
          ) : applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map(app => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Link href={`/jobs/${app.jobId}`} className="text-lg font-semibold hover:text-primary transition-colors block mb-1">
                          {app.job?.title || `Job #${app.jobId}`}
                        </Link>
                        <div className="text-sm text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {app.job?.department}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <EmailTemplatesPanel applicationId={app.id}>
                          <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-2" /> Email</Button>
                        </EmailTemplatesPanel>
                        <CvScreeningPanel applicationId={app.id}>
                          <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" /> Screen CV</Button>
                        </CvScreeningPanel>
                        {app.fitScore !== null && app.fitScore !== undefined && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Fit Score: {app.fitScore}
                          </Badge>
                        )}
                        <Select
                          value={app.stage}
                          onValueChange={(val) => handleStageChange(app.id, val)}
                          disabled={updateApplication.isPending}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {app.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
                        <span className="font-medium text-slate-900 dark:text-white block mb-1">Notes</span>
                        <p className="text-slate-600 whitespace-pre-wrap">{app.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-slate-500">
                This candidate hasn't applied to any jobs yet.
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.resumeSummary ? (
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {candidate.resumeSummary}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">No resume summary available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
