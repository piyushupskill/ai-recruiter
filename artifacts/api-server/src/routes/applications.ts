import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, applicationsTable, jobsTable, candidatesTable, activityLogTable } from "@workspace/db";
import {
  ListApplicationsQueryParams,
  CreateApplicationBody,
  GetApplicationParams,
  GetApplicationResponse,
  UpdateApplicationParams,
  UpdateApplicationBody,
  UpdateApplicationResponse,
  DeleteApplicationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichApplication(app: typeof applicationsTable.$inferSelect) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));
  return { ...app, job: { ...(job ?? {}), applicantCount: 0 }, candidate: candidate ?? {} };
}

router.get("/applications", async (req, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db
    .select()
    .from(applicationsTable)
    .orderBy(applicationsTable.createdAt);

  const apps = await dbQuery;

  let filtered = apps;
  if (query.data.jobId) {
    filtered = filtered.filter((a) => a.jobId === query.data.jobId);
  }
  if (query.data.candidateId) {
    filtered = filtered.filter((a) => a.candidateId === query.data.candidateId);
  }
  if (query.data.stage) {
    filtered = filtered.filter((a) => a.stage === query.data.stage);
  }

  const enriched = await Promise.all(filtered.map(enrichApplication));
  res.json(enriched);
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parsed.data.jobId));
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, parsed.data.candidateId));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const [app] = await db
    .insert(applicationsTable)
    .values({ ...parsed.data, updatedAt: new Date() })
    .returning();

  await db.insert(activityLogTable).values({
    type: "application_created",
    description: `${candidate.name} applied for ${job.title}`,
    candidateName: candidate.name,
    jobTitle: job.title,
  });

  res.status(201).json({ ...app, job: { ...job, applicantCount: 0 }, candidate });
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const enriched = await enrichApplication(app);
  res.json(GetApplicationResponse.parse(enriched));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [app] = await db
    .update(applicationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (parsed.data.stage && parsed.data.stage !== existing.stage) {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, existing.jobId));
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, existing.candidateId));
    await db.insert(activityLogTable).values({
      type: "stage_changed",
      description: `${candidate?.name ?? "Candidate"} moved to ${parsed.data.stage} for ${job?.title ?? "job"}`,
      candidateName: candidate?.name ?? null,
      jobTitle: job?.title ?? null,
    });
  }

  const enriched = await enrichApplication(app);
  res.json(UpdateApplicationResponse.parse(enriched));
});

router.delete("/applications/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .delete(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
