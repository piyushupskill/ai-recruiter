import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  currentTitle: text("current_title").notNull(),
  currentCompany: text("current_company"),
  yearsExperience: integer("years_experience").notNull().default(0),
  skills: text("skills").array().notNull().default([]),
  education: text("education"),
  location: text("location"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  summary: text("summary"),
  openToRemote: boolean("open_to_remote").notNull().default(true),
  availabilityWeeks: integer("availability_weeks"),
  expectedSalary: integer("expected_salary"),
  activityScore: integer("activity_score").default(50),
  responseRate: integer("response_rate").default(75),
  careerProgression: text("career_progression"),
  notableAchievements: text("notable_achievements").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
