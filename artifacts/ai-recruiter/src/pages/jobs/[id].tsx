import { useGetJob, getGetJobQueryKey, useRunRanking, useGetRankingsForJob, getGetRankingsForJobQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle2, AlertTriangle, ArrowLeft, Building, MapPin, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function JobDetail({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRevealing, setIsRevealing] = useState(false);

  const { data: job, isLoading: jobLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) }
  });

  const { data: rankings, isLoading: rankingsLoading } = useGetRankingsForJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetRankingsForJobQueryKey(jobId) }
  });

  const runRanking = useRunRanking();

  const handleRunRanking = () => {
    runRanking.mutate(
      { data: { jobId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRankingsForJobQueryKey(jobId) });
          setIsRevealing(true);
          setTimeout(() => setIsRevealing(false), 2000); // Fake reveal animation duration
          toast({
            title: "Ranking Complete",
            description: "Candidates have been scored against job requirements.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ranking Failed",
            description: "An error occurred while ranking candidates.",
          });
        }
      }
    );
  };

  if (jobLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!job) {
    return <div>Job not found.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Badge variant={job.status === 'Open' ? 'default' : 'secondary'} className="font-mono">
          {job.status}
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-mono font-bold tracking-tight">{job.title}</h1>
          <div className="flex items-center gap-6 text-muted-foreground mt-4">
            {job.department && (
              <span className="flex items-center gap-2"><Building className="h-4 w-4" />{job.department}</span>
            )}
            {job.location && (
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span>
            )}
            <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{job.minYearsExperience}+ yrs exp</span>
          </div>
        </div>
        <Button 
          size="lg" 
          className="font-mono text-lg px-8 shadow-[0_0_20px_rgba(0,180,180,0.3)] hover:shadow-[0_0_30px_rgba(0,180,180,0.5)] transition-all"
          onClick={handleRunRanking}
          disabled={runRanking.isPending}
        >
          {runRanking.isPending ? (
            <span className="animate-pulse">Analyzing...</span>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              RUN RANKING
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-mono">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {rankings && rankings.rankedCandidates.length > 0 && (
            <div className={`space-y-4 ${isRevealing ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-2xl font-mono font-bold tracking-tight flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                Ranked Candidates
              </h2>
              {rankings.rankedCandidates.map((rank, idx) => (
                <Card 
                  key={rank.id} 
                  className="border-border hover-elevate overflow-hidden transition-all duration-700 ease-out"
                  style={{
                    animationDelay: `${idx * 150}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <CardContent className="p-0">
                    <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded text-primary flex items-center justify-center font-mono text-xl font-bold border border-primary/20">
                          #{rank.rank}
                        </div>
                        <div>
                          <Link href={`/candidates/${rank.candidateId}`}>
                            <h3 className="font-mono font-bold text-xl hover:text-primary cursor-pointer transition-colors">
                              {rank.candidateName}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{rank.candidateTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <Badge variant="outline" className={`font-mono font-bold text-sm ${
                            rank.verdict === 'Strong Hire' ? 'text-green-500 border-green-500/30' :
                            rank.verdict === 'Good Fit' ? 'text-blue-500 border-blue-500/30' :
                            'text-amber-500 border-amber-500/30'
                          }`}>
                            {rank.verdict}
                          </Badge>
                        </div>
                        <div className="text-center w-24">
                          <div className="text-3xl font-mono font-bold text-foreground">
                            {Math.round(rank.overallScore)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Match Score</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-mono font-bold mb-3">AI Reasoning</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {rank.reasoning}
                          </p>
                          <div className="mt-4 space-y-3">
                            {rank.strengthHighlights.length > 0 && (
                              <div>
                                <span className="text-xs font-mono text-green-500 mb-1 block">Strengths</span>
                                <div className="flex flex-wrap gap-2">
                                  {rank.strengthHighlights.map(s => (
                                    <Badge key={s} variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {rank.gapHighlights.length > 0 && (
                              <div>
                                <span className="text-xs font-mono text-amber-500 mb-1 block">Potential Gaps</span>
                                <div className="flex flex-wrap gap-2">
                                  {rank.gapHighlights.map(g => (
                                    <Badge key={g} variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">{g}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-mono font-bold mb-3">Score Breakdown</h4>
                          <ScoreBar label="Skill Match" score={rank.skillMatchScore} />
                          <ScoreBar label="Experience" score={rank.experienceScore} />
                          <ScoreBar label="Trajectory" score={rank.careerTrajectoryScore} />
                          <ScoreBar label="Culture Signal" score={rank.culturalSignalScore} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(skill => (
                  <Badge key={skill} className="font-mono">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Nice to Have</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.niceToHaveSkills.map(skill => (
                    <Badge key={skill} variant="outline" className="font-mono">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-sidebar/50">
            <CardContent className="p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Seniority</span>
                <span className="font-medium">{job.seniorityLevel}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{job.employmentType || 'Any'}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Remote Policy</span>
                <span className="font-medium">{job.remotePolicy || 'Not specified'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string, score: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{Math.round(score)}</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}
