import { useGetCandidate, getGetCandidateQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building, MapPin, Mail, Link as LinkIcon, Briefcase, GraduationCap, Github, Linkedin, Award, Activity } from "lucide-react";

export default function CandidateDetail({ params }: { params: { id: string } }) {
  const candidateId = parseInt(params.id);

  const { data: candidate, isLoading } = useGetCandidate(candidateId, {
    query: { enabled: !!candidateId, queryKey: getGetCandidateQueryKey(candidateId) }
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!candidate) {
    return <div>Candidate not found.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/candidates">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Badge variant={candidate.openToRemote ? "default" : "secondary"} className="font-mono">
          {candidate.openToRemote ? "Open to Remote" : "On-site Only"}
        </Badge>
        {candidate.activityScore && candidate.activityScore > 80 && (
          <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 font-mono">
            Hot Candidate
          </Badge>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-mono font-bold tracking-tight">{candidate.name}</h1>
          <p className="text-xl text-muted-foreground mt-2">{candidate.currentTitle}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
            {candidate.currentCompany && (
              <span className="flex items-center gap-1.5"><Building className="h-4 w-4" />{candidate.currentCompany}</span>
            )}
            {candidate.location && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{candidate.location}</span>
            )}
            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{candidate.yearsExperience} yrs exp</span>
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{candidate.email}</span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            {candidate.linkedinUrl && (
              <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-mono"><Linkedin className="w-4 h-4 mr-2" /> LinkedIn</Button>
              </a>
            )}
            {candidate.githubUrl && (
              <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-mono"><Github className="w-4 h-4 mr-2" /> GitHub</Button>
              </a>
            )}
            {candidate.portfolioUrl && (
              <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-mono"><LinkIcon className="w-4 h-4 mr-2" /> Portfolio</Button>
              </a>
            )}
          </div>
        </div>

        <Card className="w-full lg:w-80 border-border bg-sidebar shrink-0">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Behavioral Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Activity Score</span>
              <span className="font-mono font-bold text-primary">{candidate.activityScore || '--'}/100</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Response Rate</span>
              <span className="font-mono font-bold">{candidate.responseRate || '--'}%</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{candidate.careerProgression || 'Unknown'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Availability</span>
              <span className="font-medium">{candidate.availabilityWeeks ? `in ${candidate.availabilityWeeks} wks` : 'Immediate'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {candidate.summary && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-mono">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {candidate.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {candidate.notableAchievements && candidate.notableAchievements.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Notable Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {candidate.notableAchievements.map((achievement, idx) => (
                    <li key={idx} className="flex gap-3 text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(skill => (
                  <Badge key={skill} className="font-mono">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {candidate.education && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <GraduationCap className="w-4 h-4" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{candidate.education}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
