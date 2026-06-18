import { Router } from "express";
import type { IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, candidatesTable } from "@workspace/db";
import {
  CreateCandidateBody,
  UpdateCandidateBody,
  GetCandidateParams,
  UpdateCandidateParams,
  DeleteCandidateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/candidates", async (_req, res): Promise<void> => {
  const candidates = await db
    .select()
    .from(candidatesTable)
    .orderBy(candidatesTable.createdAt);
  res.json(candidates);
});

router.post("/candidates", async (req, res): Promise<void> => {
  const parsed = CreateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [candidate] = await db.insert(candidatesTable).values({
    name: data.name,
    email: data.email,
    currentTitle: data.currentTitle,
    currentCompany: data.currentCompany ?? null,
    yearsExperience: data.yearsExperience,
    skills: data.skills ?? [],
    education: data.education ?? null,
    location: data.location ?? null,
    linkedinUrl: data.linkedinUrl ?? null,
    githubUrl: data.githubUrl ?? null,
    portfolioUrl: data.portfolioUrl ?? null,
    summary: data.summary ?? null,
    openToRemote: data.openToRemote ?? true,
    availabilityWeeks: data.availabilityWeeks ?? null,
    expectedSalary: data.expectedSalary ?? null,
    activityScore: data.activityScore ?? 50,
    responseRate: data.responseRate ?? 75,
    careerProgression: data.careerProgression ?? null,
    notableAchievements: data.notableAchievements ?? [],
  }).returning();
  res.status(201).json(candidate);
});

router.get("/candidates/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCandidateParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  res.json(candidate);
});

router.patch("/candidates/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCandidateParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [candidate] = await db
    .update(candidatesTable)
    .set(parsed.data)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  res.json(candidate);
});

router.delete("/candidates/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCandidateParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [candidate] = await db
    .delete(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
