import { useGetPipelineStats, useGetRecentActivity, useGetPipelineFunnel } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Users, KanbanSquare, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useGetPipelineStats();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({ limit: 10 });
  const { data: funnel, isLoading: loadingFunnel } = useGetPipelineFunnel();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 mt-1">Overview of your recruitment pipeline and activities.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/jobs/new">Post a Job</Link>
          </Button>
          <Button asChild>
            <Link href="/candidates/new">Add Candidate</Link>
          </Button>
        </div>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Open Jobs" value={stats.openJobs} icon={Briefcase} total={stats.totalJobs} label="total jobs" />
          <StatCard title="Total Candidates" value={stats.totalCandidates} icon={Users} />
          <StatCard title="Active Applications" value={stats.activeApplications} icon={KanbanSquare} />
          <StatCard title="Hired This Month" value={stats.hiredThisMonth} icon={CheckCircle2} className="text-primary" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>Conversion rates across all active jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : funnel ? (
              <div className="space-y-4">
                {funnel.map((stage) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="capitalize">{stage.stage}</span>
                      <span className="text-slate-500">{stage.count} ({Math.round(stage.percentage)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, total, label, className }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <div className={`text-3xl font-bold ${className || ""}`}>{value}</div>
          {total !== undefined && (
            <p className="text-xs text-slate-500 mt-1">
              out of {total} {label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
