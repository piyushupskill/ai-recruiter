import { useGetStatsOverview, getGetStatsOverviewQueryKey, useListRankingHistory, getListRankingHistoryQueryKey, useGetTopCandidates, getGetTopCandidatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Users, Activity, Trophy, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });

  const { data: history, isLoading: historyLoading } = useListRankingHistory({
    query: { queryKey: getListRankingHistoryQueryKey() }
  });

  const { data: topCandidates, isLoading: topCandidatesLoading } = useGetTopCandidates({
    query: { queryKey: getGetTopCandidatesQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time metrics and recent ranking activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Jobs" 
          value={stats?.activeJobs} 
          subtitle={`Total: ${stats?.totalJobs}`}
          icon={Briefcase} 
          loading={statsLoading} 
        />
        <MetricCard 
          title="Total Candidates" 
          value={stats?.totalCandidates} 
          icon={Users} 
          loading={statsLoading} 
        />
        <MetricCard 
          title="Ranking Runs" 
          value={stats?.rankingRunsTotal} 
          icon={Activity} 
          loading={statsLoading} 
        />
        <MetricCard 
          title="Avg Top Score" 
          value={stats?.avgTopScore ? Math.round(stats.avgTopScore) : 0} 
          icon={Trophy} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <CardTitle className="text-lg font-mono">Recent Ranking Runs</CardTitle>
            <Link href="/rankings">
              <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y divide-border/50">
                {history.slice(0, 5).map((run) => (
                  <Link key={`${run.jobId}-${run.ranAt}`} href={`/jobs/${run.jobId}`}>
                    <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{run.jobTitle}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(run.ranAt), "MMM d, h:mm a")} · {run.candidateCount} candidates
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Top Score</div>
                        <div className="font-mono text-primary font-bold">{Math.round(run.topScore)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No ranking history found.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <CardTitle className="text-lg font-mono">Top Candidates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topCandidatesLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topCandidates && topCandidates.length > 0 ? (
              <div className="divide-y divide-border/50">
                {topCandidates.map((candidate, i) => (
                  <Link key={`${candidate.candidateId}-${i}`} href={`/candidates/${candidate.candidateId}`}>
                    <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{candidate.candidateName}</div>
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {candidate.candidateTitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1 truncate max-w-[150px]">{candidate.jobTitle}</div>
                        <div className="font-mono text-green-500 font-bold">{Math.round(candidate.bestScore)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No top candidates found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, loading }: any) {
  return (
    <Card className="border-border/50 hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-mono font-bold">{value !== undefined ? value : '--'}</div>
        )}
        {subtitle && !loading && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
