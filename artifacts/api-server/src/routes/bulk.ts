import { Router, type IRouter } from "express";
import { eq, inArray, and } from "drizzle-orm";
import { db, applicationsTable, candidatesTable, jobsTable, activityLogTable } from "@workspace/db";
import { BulkUpdateStageBody, ListApplicationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// ── Bulk stage update ─────────────────────────────────────────────────────────

router.patch("/applications/bulk-stage", async (req, res): Promise<void> => {
  const parsed = BulkUpdateStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { applicationIds, stage, notes } = parsed.data;

  if (applicationIds.length === 0) {
    res.json({ updated: 0, failed: 0 });
    return;
  }

  const existing = await db
    .select()
    .from(applicationsTable)
    .where(inArray(applicationsTable.id, applicationIds));

  const updatePayload: Record<string, unknown> = { stage, updatedAt: new Date() };
  if (notes) updatePayload.notes = notes;

  const [updated] = await db
    .update(applicationsTable)
    .set(updatePayload)
    .where(inArray(applicationsTable.id, applicationIds))
    .returning();

  const updatedCount = Array.isArray(updated) ? (updated as unknown[]).length : (updated ? 1 : 0);

  for (const app of existing) {
    if (app.stage !== stage) {
      const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
      await db.insert(activityLogTable).values({
        type: "bulk_stage_change",
        description: `${candidate?.name ?? "Candidate"} moved to ${stage} for ${job?.title ?? "job"}`,
        candidateName: candidate?.name ?? null,
        jobTitle: job?.title ?? null,
      });
    }
  }

  res.json({ updated: applicationIds.length, failed: 0 });
});

// ── CSV export ────────────────────────────────────────────────────────────────

router.get("/candidates/export", async (req, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);

  const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.name);
  const applications = await db.select().from(applicationsTable);
  const jobs = await db.select().from(jobsTable);

  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const appMap = new Map<number, typeof applications[0][]>();
  for (const app of applications) {
    if (!appMap.has(app.candidateId)) appMap.set(app.candidateId, []);
    appMap.get(app.candidateId)!.push(app);
  }

  let filteredCandidates = candidates;
  if (query.success && query.data.jobId) {
    const jobApps = applications.filter((a) => a.jobId === query.data.jobId);
    const candidateIds = new Set(jobApps.map((a) => a.candidateId));
    filteredCandidates = candidates.filter((c) => candidateIds.has(c.id));
  }

  if (query.success && query.data.stage) {
    const stageApps = applications.filter((a) => a.stage === query.data.stage);
    const candidateIds = new Set(stageApps.map((a) => a.candidateId));
    filteredCandidates = filteredCandidates.filter((c) => candidateIds.has(c.id));
  }

  const escape = (val: unknown): string => {
    if (val == null) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headers = ["Name", "Email", "Phone", "Current Title", "Current Company", "Location", "Tags", "LinkedIn", "GitHub", "Applied Jobs", "Stages", "Fit Scores", "Added Date"];

  const rows = filteredCandidates.map((c) => {
    const apps = appMap.get(c.id) ?? [];
    const appliedJobs = apps.map((a) => jobMap.get(a.jobId)?.title ?? "Unknown").join("; ");
    const stages = apps.map((a) => a.stage).join("; ");
    const fitScores = apps.map((a) => a.fitScore ?? "N/A").join("; ");
    return [
      c.name, c.email, c.phone ?? "", c.currentTitle ?? "", c.currentCompany ?? "",
      c.location ?? "", (c.tags ?? []).join("; "), c.linkedinUrl ?? "", c.githubUrl ?? "",
      appliedJobs, stages, fitScores, c.createdAt.toISOString().split("T")[0],
    ].map(escape).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="candidates-export.csv"');
  res.send(csv);
});

export default router;
