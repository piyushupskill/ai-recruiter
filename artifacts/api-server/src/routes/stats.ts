import { Router } from "express";
import type { IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, jobsTable, candidatesTable, rankingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [jobStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where status = 'active')::int`,
    })
    .from(jobsTable);

  const [candidateStats] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(candidatesTable);

  const [rankingStats] = await db
    .select({
      runs: sql<number>`count(distinct job_id)::int`,
      avgTop: sql<number>`round(avg(overall_score))::int`,
    })
    .from(rankingsTable)
    .where(eq(rankingsTable.rank, 1));

  res.json({
    totalJobs: jobStats?.total ?? 0,
    activeJobs: jobStats?.active ?? 0,
    totalCandidates: candidateStats?.total ?? 0,
    rankingRunsTotal: rankingStats?.runs ?? 0,
    avgTopScore: rankingStats?.avgTop ?? 0,
  });
});

router.get("/stats/top-candidates", async (_req, res): Promise<void> => {
  const allRankings = await db
    .select()
    .from(rankingsTable)
    .orderBy(rankingsTable.overallScore)
    .limit(50);

  const allJobs = await db.select().from(jobsTable);
  const allCandidates = await db.select().from(candidatesTable);
  const jobMap = new Map(allJobs.map((j) => [j.id, j]));
  const candidateMap = new Map(allCandidates.map((c) => [c.id, c]));

  // Get the best ranking per candidate
  const bestByCand = new Map<number, typeof allRankings[number]>();
  for (const r of allRankings) {
    const existing = bestByCand.get(r.candidateId);
    if (!existing || r.overallScore > existing.overallScore) {
      bestByCand.set(r.candidateId, r);
    }
  }

  const top = Array.from(bestByCand.values())
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10)
    .map((r) => {
      const candidate = candidateMap.get(r.candidateId);
      const job = jobMap.get(r.jobId);
      return {
        candidateId: r.candidateId,
        candidateName: candidate?.name ?? "Unknown",
        candidateTitle: candidate?.currentTitle ?? "",
        bestScore: r.overallScore,
        jobTitle: job?.title ?? "Unknown Job",
        rank: r.rank,
      };
    });

  res.json(top);
});

export default router;
