import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db, jobsTable, candidatesTable, applicationsTable, activityLogTable } from "@workspace/db";
import { GetRecentActivityQueryParams, GetPipelineFunnelQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;

router.get("/pipeline/stats", async (_req, res): Promise<void> => {
  const [jobStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where status = 'open')::int`,
    })
    .from(jobsTable);

  const [candidateCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(candidatesTable);

  const [appStats] = await db
    .select({
      active: sql<number>`count(*) filter (where stage not in ('hired', 'rejected'))::int`,
    })
    .from(applicationsTable);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [hiredCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicationsTable)
    .where(
      sql`stage = 'hired' and updated_at >= ${startOfMonth.toISOString()}`
    );

  const [avgFit] = await db
    .select({ avg: sql<number | null>`avg(fit_score)` })
    .from(applicationsTable)
    .where(sql`fit_score is not null`);

  const stageCounts = await db
    .select({
      stage: applicationsTable.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.stage);

  const stageBreakdown: Record<string, number> = {};
  for (const s of stageCounts) {
    stageBreakdown[s.stage] = s.count;
  }

  res.json({
    totalJobs: jobStats?.total ?? 0,
    openJobs: jobStats?.open ?? 0,
    totalCandidates: candidateCount?.total ?? 0,
    activeApplications: appStats?.active ?? 0,
    hiredThisMonth: hiredCount?.count ?? 0,
    avgFitScore: avgFit?.avg ? Math.round(Number(avgFit.avg) * 10) / 10 : null,
    stageBreakdown,
  });
});

router.get("/pipeline/activity", async (req, res): Promise<void> => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 20;

  const activity = await db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);

  res.json(activity);
});

router.get("/pipeline/funnel", async (req, res): Promise<void> => {
  const query = GetPipelineFunnelQueryParams.safeParse(req.query);

  const stageCounts = await db
    .select({
      stage: applicationsTable.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.stage);

  const countMap = new Map(stageCounts.map((s) => [s.stage, s.count]));
  const total = [...countMap.values()].reduce((a, b) => a + b, 0);

  const funnel = STAGES.map((stage) => ({
    stage,
    count: countMap.get(stage) ?? 0,
    percentage: total > 0 ? Math.round(((countMap.get(stage) ?? 0) / total) * 1000) / 10 : 0,
  }));

  res.json(funnel);
});

export default router;
