import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department"),
  requiredSkills: text("required_skills").array().notNull().default([]),
  niceToHaveSkills: text("nice_to_have_skills").array().notNull().default([]),
  minYearsExperience: integer("min_years_experience").notNull().default(0),
  seniorityLevel: text("seniority_level").notNull().default("mid"),
  employmentType: text("employment_type"),
  location: text("location"),
  remotePolicy: text("remote_policy"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
