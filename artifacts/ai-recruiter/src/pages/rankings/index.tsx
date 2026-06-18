import { useListRankingHistory, getListRankingHistoryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function RankingsList() {
  const { data: history, isLoading } = useListRankingHistory({
    query: { queryKey: getListRankingHistoryQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Ranking History</h1>
        <p className="text-muted-foreground mt-2">Log of all algorithmic ranking runs across your organization.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))
        ) : history && history.length > 0 ? (
          history.map((run, i) => (
            <Link key={`${run.jobId}-${i}`} href={`/jobs/${run.jobId}`}>
              <Card className="border-border/50 hover-elevate cursor-pointer transition-colors group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-lg group-hover:text-primary transition-colors">
                        {run.jobTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {format(new Date(run.ranAt), "MMM d, yyyy h:mm a")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {run.candidateCount} evaluated
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Top Score</div>
                    <div className="text-2xl font-mono font-bold text-green-500">
                      {Math.round(run.topScore)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-lg bg-card">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-mono font-bold">No ranking history</h3>
            <p className="text-muted-foreground">Run a ranking from any job detail page to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
