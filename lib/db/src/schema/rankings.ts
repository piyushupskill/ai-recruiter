import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobsTable } from "./jobs";
import { candidatesTable } from "./candidates";

export const rankingsTable = pgTable("rankings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  skillMatchScore: integer("skill_match_score").notNull(),
  experienceScore: integer("experience_score").notNull(),
  careerTrajectoryScore: integer("career_trajectory_score").notNull(),
  culturalSignalScore: integer("cultural_signal_score").notNull(),
  availabilityScore: integer("availability_score").notNull(),
  rank: integer("rank").notNull(),
  verdict: text("verdict").notNull(),
  reasoning: text("reasoning").notNull(),
  strengthHighlights: text("strength_highlights").array().notNull().default([]),
  gapHighlights: text("gap_highlights").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRankingSchema = createInsertSchema(rankingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRanking = z.infer<typeof insertRankingSchema>;
export type Ranking = typeof rankingsTable.$inferSelect;
