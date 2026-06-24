import { useGetJob, useListApplications, getGetJobQueryKey, useGetJobSourcing, getGetJobSourcingQueryKey, useGetInterviewQuestions, getGetInterviewQuestionsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Briefcase, DollarSign, Clock, ArrowLeft, UserCircle2, Star, Copy, ExternalLink, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplatesPanel } from "@/components/email-templates-panel";
import { CvScreeningPanel } from "@/components/cv-screening-panel";

const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

function SourcingTab({ jobId }: { jobId: number }) {
  const { data: sourcing, isLoading } = useGetJobSourcing(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobSourcingQueryKey(jobId) }
  });
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Search string copied to clipboard." });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  if (!sourcing) return <div className="py-8 text-center text-slate-500">No sourcing strategy found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Boolean Search Strings</CardTitle>
          <CardDescription>Copy these strings to use in your ATS or resume database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourcing.booleanSearch.map((str, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{str.label}</TableCell>
                  <TableCell>{str.title}</TableCell>
                  <TableCell className="font-mono text-xs">{str.keywords}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(str.keywords)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Search Links</CardTitle>
          <CardDescription>Quick links to LinkedIn searches for this role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourcing.linkedinSearchUrls.map((url, i) => (
              <Card key={i} className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 space-y-3">
                  <div className="font-medium text-sm">{url.label}</div>
                  <div className="text-xs text-slate-500">{url.angle}</div>
                  <Button variant="secondary" size="sm" className="w-full" asChild>
                    <a href={url.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open in LinkedIn
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Channels</CardTitle>
          <CardDescription>Recommended sourcing channels beyond LinkedIn.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Best For</TableHead>
                <TableHead>Tactic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourcing.otherChannels.map((ch, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{ch.channel}</TableCell>
                  <TableCell>{ch.bestFor}</TableCell>
                  <TableCell>{ch.tactic}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InterviewQuestionsTab({ jobId }: { jobId: number }) {
  const { data: bank, isLoading } = useGetInterviewQuestions(jobId, {
    query: { enabled: !!jobId, queryKey: getGetInterviewQuestionsQueryKey(jobId) }
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (!bank) return <div className="py-8 text-center text-slate-500">No interview questions found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <Accordion type="multiple" className="w-full space-y-4">
        {bank.stages.map((stage, i) => (
          <AccordionItem value={`stage-${i}`} key={i} className="bg-white dark:bg-slate-950 border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex flex-col items-start text-left gap-1">
                <span className="font-semibold text-base">{stage.stage}</span>
                <span className="text-sm font-normal text-slate-500">Interviewer: {stage.interviewer}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 space-y-6">
              {stage.competencies.map((comp, j) => (
                <div key={j} className="space-y-3">
                  <h4 className="font-medium text-sm text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {comp.competency}
                  </h4>
                  <ul className="space-y-2 pl-4">
                    {comp.questions.map((q, k) => (
                      <li key={k} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span> <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

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

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="mb-8 h-12 bg-transparent border-b rounded-none w-full justify-start p-0 space-x-8">
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="sourcing" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            Sourcing Strategy
          </TabsTrigger>
          <TabsTrigger value="interview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            Interview Questions
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12">
            Job Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 gap-8">
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
                          <Card key={app.id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm group">
                            <CardContent className="p-4 relative">
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
                              
                              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-950 p-1 rounded shadow-sm">
                                <EmailTemplatesPanel applicationId={app.id}>
                                  <Button size="icon" variant="ghost" className="w-6 h-6 h-6"><Mail className="w-3 h-3" /></Button>
                                </EmailTemplatesPanel>
                                <CvScreeningPanel applicationId={app.id}>
                                  <Button size="icon" variant="ghost" className="w-6 h-6"><FileText className="w-3 h-3" /></Button>
                                </CvScreeningPanel>
                              </div>
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
        </TabsContent>

        <TabsContent value="sourcing">
          <SourcingTab jobId={id} />
        </TabsContent>

        <TabsContent value="interview">
          <InterviewQuestionsTab jobId={id} />
        </TabsContent>

        <TabsContent value="details">
          <div className="max-w-3xl">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
