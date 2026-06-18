import { Router } from "express";
import type { IRouter } from "express";
import { eq, desc, max } from "drizzle-orm";
import { db, jobsTable, candidatesTable, rankingsTable } from "@workspace/db";
import { RunRankingBody, GetRankingsForJobParams } from "@workspace/api-zod";
import { rankCandidates } from "../lib/ranking-engine";

const router: IRouter = Router();

router.post("/rankings/run", async (req, res): Promise<void> => {
  const parsed = RunRankingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { jobId, candidateIds } = parsed.data;

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  // Fetch candidates — either the specified ones or all candidates
  let candidates;
  if (candidateIds && candidateIds.length > 0) {
    candidates = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, candidateIds[0]));
    // For multiple IDs, fetch all and filter (simple approach for PoC)
    candidates = await db.select().from(candidatesTable);
    candidates = candidates.filter((c) => candidateIds.includes(c.id));
  } else {
    candidates = await db.select().from(candidatesTable);
  }

  if (candidates.length === 0) {
    res.status(400).json({ error: "No candidates available to rank" });
    return;
  }

  // Run the ranking engine
  const ranked = rankCandidates(job, candidates);

  // Delete previous rankings for this job, then save new ones
  await db.delete(rankingsTable).where(eq(rankingsTable.jobId, jobId));

  const inserted = await db
    .insert(rankingsTable)
    .values(
      ranked.map((r) => ({
        jobId: r.jobId,
        candidateId: r.candidateId,
        overallScore: r.overallScore,
        skillMatchScore: r.skillMatchScore,
        experienceScore: r.experienceScore,
        careerTrajectoryScore: r.careerTrajectoryScore,
        culturalSignalScore: r.culturalSignalScore,
        availabilityScore: r.availabilityScore,
        rank: r.rank,
        verdict: r.verdict,
        reasoning: r.reasoning,
        strengthHighlights: r.strengthHighlights,
        gapHighlights: r.gapHighlights,
      })),
    )
    .returning();

  const rankedWithMeta = inserted
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const candidate = candidates.find((c) => c.id === r.candidateId);
      return {
        ...r,
        candidateName: candidate?.name ?? null,
        candidateTitle: candidate?.currentTitle ?? null,
        candidateSkills: candidate?.skills ?? [],
        createdAt: r.createdAt.toISOString(),
      };
    });

  res.json({
    jobId: job.id,
    jobTitle: job.title,
    rankedCandidates: rankedWithMeta,
    ranAt: new Date().toISOString(),
  });
});

router.get("/rankings/job/:jobId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetRankingsForJobParams.safeParse({ jobId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const rankings = await db
    .select()
    .from(rankingsTable)
    .where(eq(rankingsTable.jobId, params.data.jobId))
    .orderBy(rankingsTable.rank);

  const allCandidates = await db.select().from(candidatesTable);
  const candidateMap = new Map(allCandidates.map((c) => [c.id, c]));

  const result = rankings.map((r) => {
    const candidate = candidateMap.get(r.candidateId);
    return {
      ...r,
      candidateName: candidate?.name ?? null,
      candidateTitle: candidate?.currentTitle ?? null,
      candidateSkills: candidate?.skills ?? [],
      createdAt: r.createdAt.toISOString(),
    };
  });

  res.json(result);
});

router.get("/rankings/history", async (_req, res): Promise<void> => {
  const allJobs = await db.select().from(jobsTable);
  const jobMap = new Map(allJobs.map((j) => [j.id, j]));

  // Get the latest ranking run per job (by max createdAt)
  const allRankings = await db
    .select()
    .from(rankingsTable)
    .orderBy(desc(rankingsTable.createdAt));

  // Group by jobId, take the latest run's stats
  const jobLatest = new Map<number, { ranAt: Date; candidateCount: number; topScore: number }>();
  for (const r of allRankings) {
    if (!jobLatest.has(r.jobId)) {
      jobLatest.set(r.jobId, {
        ranAt: r.createdAt,
        candidateCount: 0,
        topScore: 0,
      });
    }
    const entry = jobLatest.get(r.jobId)!;
    entry.candidateCount++;
    if (r.overallScore > entry.topScore) entry.topScore = r.overallScore;
  }

  const history = Array.from(jobLatest.entries())
    .map(([jobId, stats]) => ({
      jobId,
      jobTitle: jobMap.get(jobId)?.title ?? "Unknown Job",
      candidateCount: stats.candidateCount,
      topScore: stats.topScore,
      ranAt: stats.ranAt.toISOString(),
    }))
    .sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime());

  res.json(history);
});

export default router;
