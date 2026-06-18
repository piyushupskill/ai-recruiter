import { useListCandidates, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function CandidatesList() {
  const { data: candidates, isLoading } = useListCandidates({
    query: { queryKey: getListCandidatesQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-2">Browse your talent pool and detailed profiles.</p>
        </div>
        <Link href="/candidates/new">
          <Button className="font-mono">
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
        ) : candidates && candidates.length > 0 ? (
          candidates.map((candidate) => (
            <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
              <Card className="border-border/50 hover-elevate cursor-pointer transition-colors group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-mono font-bold text-lg group-hover:text-primary transition-colors">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{candidate.currentTitle}</p>
                    </div>
                    {candidate.activityScore && candidate.activityScore > 80 && (
                      <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 text-xs">
                        Hot
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span className="truncate">{candidate.currentCompany || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{candidate.location || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1 self-center">
                        +{candidate.skills.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center p-12 border border-dashed border-border rounded-lg bg-card">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-mono font-bold">No candidates found</h3>
            <p className="text-muted-foreground mb-6">Add candidates to your talent pool.</p>
            <Link href="/candidates/new">
              <Button variant="outline" className="font-mono">
                Add First Candidate
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
