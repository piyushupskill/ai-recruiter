import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, jobsTable, applicationsTable, candidatesTable, activityLogTable } from "@workspace/db";
import { GetJobParams, ScreenApplicationBody, GenerateEmailTemplateBody, GetApplicationParams } from "@workspace/api-zod";

const router: IRouter = Router();

// ── Sourcing strategy ─────────────────────────────────────────────────────────

type RoleCategory = "engineering" | "design" | "product" | "data" | "sales" | "marketing" | "operations" | "management" | "general";

function detectRoleCategory(title: string, department: string): RoleCategory {
  const t = (title + " " + department).toLowerCase();
  if (/engineer|developer|software|backend|frontend|fullstack|devops|sre|platform|infrastructure/.test(t)) return "engineering";
  if (/design|ux|ui|product design/.test(t)) return "design";
  if (/product manager|pm |head of product|vp product/.test(t)) return "product";
  if (/data|analyst|analytics|scientist|ml|machine learning/.test(t)) return "data";
  if (/sales|account exec|ae |sdr|bdr|business dev/.test(t)) return "sales";
  if (/marketing|growth|content|brand|demand gen/.test(t)) return "marketing";
  if (/operat|chief of staff|program manager|project manager/.test(t)) return "operations";
  if (/manager|director|head of|vp |vice president|lead/.test(t)) return "management";
  return "general";
}

const TITLE_SYNONYMS: Record<RoleCategory, string> = {
  engineering: '"senior engineer" OR "senior software engineer" OR "staff engineer" OR "lead engineer" OR "principal engineer"',
  design: '"product designer" OR "senior designer" OR "lead designer" OR "ux designer" OR "ui/ux designer"',
  product: '"product manager" OR "senior PM" OR "product lead" OR "group product manager" OR "product owner"',
  data: '"data scientist" OR "ML engineer" OR "machine learning engineer" OR "applied scientist" OR "data analyst"',
  sales: '"account executive" OR "AE" OR "sales lead" OR "senior AE" OR "enterprise sales"',
  marketing: '"marketing manager" OR "growth manager" OR "demand gen" OR "content lead" OR "marketing lead"',
  operations: '"operations manager" OR "program manager" OR "COO" OR "chief of staff" OR "ops lead"',
  management: '"engineering manager" OR "EM" OR "director of engineering" OR "VP engineering" OR "tech lead manager"',
  general: '"senior manager" OR "team lead" OR "department head" OR "specialist"',
};

const SKILL_KEYWORDS: Record<RoleCategory, string> = {
  engineering: '(TypeScript OR Python OR Go OR Rust OR "distributed systems") AND (AWS OR GCP OR Kubernetes)',
  design: '(Figma OR "design systems" OR "product design" OR "user research") AND (B2B OR SaaS)',
  product: '("product strategy" OR roadmap OR "user research" OR "cross-functional") AND (SaaS OR startup)',
  data: '(Python OR SQL OR dbt OR Spark OR "machine learning") AND (analytics OR "data pipeline")',
  sales: '("enterprise sales" OR "quota" OR "ARR" OR "closing") AND (SaaS OR B2B)',
  marketing: '("demand generation" OR SEO OR "paid acquisition" OR "content strategy") AND (SaaS OR B2B)',
  operations: '("process improvement" OR "OKR" OR "cross-functional" OR "stakeholder management")',
  management: '("people management" OR "team lead" OR "hiring" OR "performance review") AND (engineering OR product)',
  general: '("cross-functional" OR "stakeholder" OR "leadership")',
};

const SOURCING_CHANNELS: Record<RoleCategory, Array<{ channel: string; bestFor: string; tactic: string }>> = {
  engineering: [
    { channel: "GitHub", bestFor: "Engineers", tactic: "Search public repos by language, check contribution consistency and PR quality." },
    { channel: "Stack Overflow", bestFor: "Deep specialists", tactic: "Find top answerers on niche tags — check profile for contact info." },
    { channel: "HN Who Wants to be Hired", bestFor: "Startup-minded engineers", tactic: 'Monthly thread at news.ycombinator.com — search "who wants to be hired".' },
  ],
  design: [
    { channel: "Dribbble", bestFor: "Visual designers", tactic: "Search by skill tag; message designers with 500+ followers and relevant portfolio work." },
    { channel: "Behance", bestFor: "UX/product designers", tactic: "Filter by 'Product Design' category; look for case studies showing process, not just outputs." },
    { channel: "Twitter/X", bestFor: "Design thought leaders", tactic: "Search #ProductDesign #UX to find designers posting about their craft." },
  ],
  product: [
    { channel: "Product Hunt", bestFor: "Builder-type PMs", tactic: "Makers of top products in the relevant category — often open to new opportunities." },
    { channel: "LinkedIn", bestFor: "All PM profiles", tactic: "Search 'product manager' + company name to find PMs at competitor companies." },
    { channel: "Lenny's Newsletter community", bestFor: "High-signal PMs", tactic: "Active community of product practitioners — post roles or DM active members." },
  ],
  data: [
    { channel: "Kaggle", bestFor: "ML/Data Science", tactic: "Top competition participants — check leaderboard profiles for contact info." },
    { channel: "Google Scholar", bestFor: "ML/Research roles", tactic: "Co-authors on relevant papers, often with .edu or company emails." },
    { channel: "GitHub", bestFor: "Data engineers", tactic: 'Search repos tagged with "data-engineering", "dbt", "airflow", "spark".' },
  ],
  sales: [
    { channel: "LinkedIn", bestFor: "AEs and BDRs", tactic: 'Search "account executive" at competitor + "quota attainment" keywords.' },
    { channel: "RepVue", bestFor: "Sales talent", tactic: "Platform where reps review companies — post your role or source from reviewer profiles." },
    { channel: "Bravado", bestFor: "Top performers", tactic: "Sales community where quota attainment is verified — high signal candidates." },
  ],
  marketing: [
    { channel: "Growth.design", bestFor: "Growth marketers", tactic: "Active community of growth practitioners — post roles or source directly." },
    { channel: "Twitter/X", bestFor: "Content and growth leads", tactic: "Search for people posting about SEO, paid acquisition, or B2B SaaS growth." },
    { channel: "LinkedIn", bestFor: "All marketing roles", tactic: 'Search "marketing manager" at competitors and similar-stage companies.' },
  ],
  operations: [
    { channel: "LinkedIn", bestFor: "Operations professionals", tactic: 'Search "operations manager" OR "chief of staff" at high-growth startups.' },
    { channel: "YC Alumni", bestFor: "Founder-operators", tactic: "Founders whose startups ended and moved into operations/COO roles." },
    { channel: "Twitter/X", bestFor: "Thought leaders", tactic: "Search #OperationsExcellence or follow startup operations influencers." },
  ],
  management: [
    { channel: "LinkedIn", bestFor: "Engineering managers", tactic: 'Search "engineering manager" at FAANG, high-growth startups in your space.' },
    { channel: "Lenny's Newsletter community", bestFor: "Product leaders", tactic: "Active community of senior PMs and product leaders — post or source directly." },
    { channel: "Conference speakers", bestFor: "Senior/staff+", tactic: 'Search "[conference name] speakers 2025" — speakers pre-vetted for communication skills.' },
  ],
  general: [
    { channel: "LinkedIn", bestFor: "All roles", tactic: "Use Boolean search with title synonyms to find the right profiles." },
    { channel: "AngelList/Wellfound", bestFor: "Startup-minded candidates", tactic: "Post role and source directly from candidate profiles." },
    { channel: "Referrals", bestFor: "High-trust hires", tactic: "Ask current team for referrals — 3x higher retention than external hires." },
  ],
};

function buildLinkedinUrl(keywords: string, geoUrn?: string): string {
  const base = "https://www.linkedin.com/search/results/people/";
  const params = new URLSearchParams({ keywords, origin: "FACETED_SEARCH" });
  if (geoUrn) params.set("geoUrn", `["${geoUrn}"]`);
  return `${base}?${params.toString()}`;
}

router.get("/jobs/:id/sourcing", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const category = detectRoleCategory(job.title, job.department);
  const titleSyn = TITLE_SYNONYMS[category];
  const skillKw = SKILL_KEYWORDS[category];

  const booleanStrings = [
    { label: "LinkedIn Title field", title: titleSyn, keywords: skillKw },
    { label: "X-ray Google search", title: `site:linkedin.com/in ${job.title.toLowerCase()}`, keywords: `-recruiter -hiring -"open to work"` },
    { label: "Impact-verb search", title: titleSyn, keywords: `("built" OR "shipped" OR "launched" OR "scaled" OR "0 to 1") AND ${skillKw.split(" AND ")[0]}` },
  ];

  const locationParam = job.location.toLowerCase().includes("remote") ? undefined : "103644278";

  const linkedinUrls = [
    { label: "Direct competitors", url: buildLinkedinUrl(`${job.title} competitor`, locationParam), angle: "Candidates at direct competitors" },
    { label: "Core skill focus", url: buildLinkedinUrl(`${job.title} ${job.department}`, locationParam), angle: "Candidates with the core required background" },
    { label: "Adjacent companies", url: buildLinkedinUrl(`${job.department} ${job.title} SaaS`, locationParam), angle: "Candidates at similar-stage companies" },
    { label: "Broader pool", url: buildLinkedinUrl(job.title, locationParam), angle: "All matching titles, no company filter" },
    { label: "Remote / worldwide", url: buildLinkedinUrl(`${job.title} ${job.department}`), angle: "Global talent pool (no geo filter)" },
  ];

  res.json({ jobTitle: job.title, booleanStrings, linkedinUrls, channels: SOURCING_CHANNELS[category] });
});

// ── Interview question bank ───────────────────────────────────────────────────

const QUESTION_BANK: Record<RoleCategory, Array<{ stage: string; interviewer: string; competencies: Array<{ name: string; questions: string[] }> }>> = {
  engineering: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Motivation & fit", questions: ["What made you look at this role specifically?", "What does your ideal next step look like?"] },
        { name: "Background check", questions: ["Walk me through your last two roles.", "What's the largest system you've worked on?"] },
      ],
    },
    {
      stage: "Technical Interview", interviewer: "Senior Engineer",
      competencies: [
        { name: "System design", questions: ["Design a rate-limiting service for a high-traffic API.", "How would you architect a real-time notification system?"] },
        { name: "Problem solving", questions: ["Walk me through a complex bug you debugged — what was your process?", "Tell me about a time you had to optimize a slow query or service."] },
        { name: "Code quality", questions: ["How do you approach writing testable code?", "What does good code review look like to you?"] },
      ],
    },
    {
      stage: "Culture & Values", interviewer: "Cross-functional",
      competencies: [
        { name: "Collaboration", questions: ["Tell me about a time you disagreed with a product decision. How did you handle it?", "How do you work with non-technical stakeholders?"] },
        { name: "Ownership", questions: ["Describe a project where things went wrong. What did you do?", "Have you ever pushed back on a deadline? How?"] },
      ],
    },
    {
      stage: "Hiring Manager", interviewer: "Engineering Manager",
      competencies: [
        { name: "Growth & trajectory", questions: ["Where do you want to be in 3 years?", "What skills are you actively trying to develop?"] },
        { name: "Team fit", questions: ["What kind of engineering culture brings out your best work?", "What do you need from a manager?"] },
      ],
    },
  ],
  design: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Portfolio overview", questions: ["Walk me through your most impactful project.", "What's your design process from problem to ship?"] },
        { name: "Tools & craft", questions: ["How do you use Figma in your day-to-day?", "How do you think about design systems?"] },
      ],
    },
    {
      stage: "Portfolio Review", interviewer: "Design Lead",
      competencies: [
        { name: "Problem definition", questions: ["How did you frame the problem before designing?", "What constraints were you working within?"] },
        { name: "User empathy", questions: ["How did you validate your design decisions with users?", "Tell me about a time user research changed your direction."] },
        { name: "Craft", questions: ["What's the hardest visual/interaction problem you've solved?", "How do you balance speed with quality?"] },
      ],
    },
    {
      stage: "Cross-functional", interviewer: "PM + Engineer",
      competencies: [
        { name: "Collaboration", questions: ["How do you work with engineers who push back on your designs?", "Tell me about a design spec handoff that went well."] },
        { name: "Influence", questions: ["How do you advocate for design quality when timelines are tight?", "Give me an example of you raising the design bar on a project."] },
      ],
    },
  ],
  product: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Background", questions: ["What's the product you're most proud of shipping?", "How do you think about prioritization?"] },
      ],
    },
    {
      stage: "Product Case Study", interviewer: "PM Lead",
      competencies: [
        { name: "Strategy", questions: ["How would you grow our core metric by 20% in 6 months?", "Walk me through how you'd prioritize a backlog with 50 items."] },
        { name: "User empathy", questions: ["How do you decide what to build when users ask for conflicting things?", "Tell me about a product decision driven entirely by user research."] },
        { name: "Data", questions: ["How do you know when a feature is successful?", "Walk me through a time you used data to change your roadmap."] },
      ],
    },
    {
      stage: "Cross-functional", interviewer: "Engineer + Designer",
      competencies: [
        { name: "Collaboration", questions: ["How do you work with a skeptical engineering team?", "Tell me about a product spec you're proud of."] },
      ],
    },
  ],
  data: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Background", questions: ["What's the most impactful analysis you've done?", "What's your SQL proficiency level?"] },
      ],
    },
    {
      stage: "Technical Interview", interviewer: "Data Lead",
      competencies: [
        { name: "SQL & data modeling", questions: ["How would you model a funnel analysis for a SaaS product?", "Write a query to find users who churned after 30 days."] },
        { name: "Statistical reasoning", questions: ["How do you design an A/B test?", "How do you handle missing data in an analysis?"] },
        { name: "Communication", questions: ["How do you present a complex finding to a non-technical stakeholder?", "Tell me about a time your analysis changed a business decision."] },
      ],
    },
  ],
  sales: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Track record", questions: ["What was your quota last year and did you hit it?", "What's your average deal size?"] },
      ],
    },
    {
      stage: "Mock Pitch", interviewer: "Sales Manager",
      competencies: [
        { name: "Discovery", questions: ["Walk me through how you run a discovery call.", "How do you qualify prospects quickly?"] },
        { name: "Objection handling", questions: ["Our price is 30% higher than a competitor — how do you handle that?", "Role-play: the deal has stalled. How do you re-engage?"] },
        { name: "Process", questions: ["How do you manage your pipeline?", "What does your follow-up cadence look like?"] },
      ],
    },
  ],
  marketing: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Background", questions: ["What campaign are you most proud of?", "How do you measure marketing ROI?"] },
      ],
    },
    {
      stage: "Strategy Interview", interviewer: "Marketing Lead",
      competencies: [
        { name: "Strategy", questions: ["How would you build a demand gen engine from scratch?", "How do you prioritize channels with a limited budget?"] },
        { name: "Data", questions: ["What metrics do you track weekly?", "Tell me about a campaign that underperformed and what you did."] },
      ],
    },
  ],
  operations: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Background", questions: ["What process did you build that had the biggest impact?", "How do you handle competing priorities?"] },
      ],
    },
    {
      stage: "Case Study", interviewer: "Operations Lead",
      competencies: [
        { name: "Problem solving", questions: ["How would you redesign our onboarding process if you had 30 days?", "Walk me through a process improvement you've led end-to-end."] },
        { name: "Stakeholder management", questions: ["How do you align stakeholders who disagree on priorities?", "Tell me about a cross-functional project you drove."] },
      ],
    },
  ],
  management: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Background", questions: ["How big is the largest team you've managed?", "How do you hire?"] },
      ],
    },
    {
      stage: "Leadership Interview", interviewer: "VP / Director",
      competencies: [
        { name: "People leadership", questions: ["How do you handle a low performer on your team?", "Tell me about someone you developed who grew significantly."] },
        { name: "Technical depth", questions: ["How do you stay technically credible without being in the weeds?", "Tell me about a major technical decision your team made."] },
        { name: "Org building", questions: ["How do you build team culture?", "What's your hiring process when you need to scale fast?"] },
      ],
    },
  ],
  general: [
    {
      stage: "Phone Screen", interviewer: "Recruiter",
      competencies: [
        { name: "Motivation", questions: ["Why this role?", "What are you looking for in your next company?"] },
        { name: "Background", questions: ["Walk me through your career.", "What's your proudest professional achievement?"] },
      ],
    },
    {
      stage: "Panel Interview", interviewer: "Hiring Team",
      competencies: [
        { name: "Problem solving", questions: ["Tell me about a challenging problem you solved.", "How do you approach something you've never done before?"] },
        { name: "Collaboration", questions: ["Tell me about a time you worked with a difficult colleague.", "How do you build trust with a new team?"] },
      ],
    },
  ],
};

router.get("/jobs/:id/interview-questions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const category = detectRoleCategory(job.title, job.department);
  res.json({ jobTitle: job.title, stages: QUESTION_BANK[category] ?? QUESTION_BANK.general });
});

// ── Email templates ───────────────────────────────────────────────────────────

router.post("/applications/:id/email-template", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = GenerateEmailTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));

  const name = candidate?.name ?? "Candidate";
  const firstName = name.split(" ")[0];
  const title = job?.title ?? "the role";
  const company = "[Your Company]";

  const templates: Record<string, { subject: string; body: string }> = {
    advancement: {
      subject: `Next steps — ${title} at ${company}`,
      body: `Hi ${firstName},\n\nThank you for taking the time to apply for the ${title} position at ${company}. We've reviewed your background and would love to move forward with you.\n\nWe'd like to schedule a [30-minute phone screen / technical interview / panel interview] at your convenience. Please reply with a few times that work for you this week or next, or use this link: [scheduling link].\n\nLooking forward to connecting.\n\nBest,\n[Your name]\n${company}`,
    },
    rejection: {
      subject: `Update on your application — ${company}`,
      body: `Hi ${firstName},\n\nThank you for applying for the ${title} position at ${company} and for the time you invested in our process.\n\nAfter careful consideration, we've decided to move forward with other candidates whose backgrounds more closely match our current needs. This was a competitive process and we appreciate your interest.\n\nWe'll keep your profile on file and hope our paths cross in the future.\n\nBest of luck,\n[Your name]\n${company}`,
    },
    hold: {
      subject: `Update on ${title} — ${company}`,
      body: `Hi ${firstName},\n\nThank you for your patience during our ${title} hiring process at ${company}.\n\nWe're genuinely impressed with your background and want to be transparent: we have a few more interviews in progress and expect to make a decision by [date]. We'd love to include you in our final considerations.\n\nWe'll be in touch by [specific date]. In the meantime, please don't hesitate to reach out if you have questions.\n\nBest,\n[Your name]\n${company}`,
    },
    offer: {
      subject: `Offer — ${title} at ${company}`,
      body: `Hi ${firstName},\n\nI'm thrilled to let you know that we'd like to offer you the ${title} position at ${company}!\n\nI'll be sending over the formal offer letter shortly with full details. In the meantime, I wanted to be the first to say — welcome to the team.\n\nPlease let me know if you have any questions as you review the offer. We're excited about the prospect of you joining us.\n\nWarmly,\n[Your name]\n${company}`,
    },
    interview_invite: {
      subject: `Interview invitation — ${title} at ${company}`,
      body: `Hi ${firstName},\n\nWe'd love to invite you to the next round of interviews for the ${title} role at ${company}.\n\nThe interview will be a [45-minute / 1-hour] [phone / video / on-site] session with [interviewer name(s)]. We'll be discussing [topics: e.g., your experience, a technical challenge, etc.].\n\nHere are a few times that work for us:\n- [Date/time option 1]\n- [Date/time option 2]\n- [Date/time option 3]\n\nOr feel free to use this scheduling link: [link]\n\nLooking forward to it!\n\nBest,\n[Your name]\n${company}`,
    },
    outreach: {
      subject: `${title} opportunity — ${company}`,
      body: `Hi ${firstName},\n\nI came across your profile and was impressed by your background${candidate?.currentCompany ? ` at ${candidate.currentCompany}` : ""}.\n\nWe're hiring a ${title} at ${company} and your experience looks like a strong match. We're [brief company description — stage, mission, team size].\n\nThe role involves [1-2 specific things that would excite a strong candidate]. We're [remote / based in X / hybrid].\n\nWorth a 15-minute call to hear more?\n\nBest,\n[Your name]\n${company}`,
    },
    follow_up: {
      subject: `Re: ${title} — ${company}`,
      body: `Hi ${firstName},\n\nJust wanted to follow up on my previous note about the ${title} role at ${company}.\n\nWe [brief new piece of info — e.g., "just closed our Series A" / "recently launched X" / "had a great panel interview this week"]. The role is still open and I'd love to connect if the timing is right.\n\nEven if now isn't the right moment, I'd be happy to keep the conversation going for the future.\n\nBest,\n[Your name]\n${company}`,
    },
  };

  const template = templates[parsed.data.type];
  if (!template) { res.status(400).json({ error: "Unknown template type" }); return; }

  res.json({ type: parsed.data.type, ...template });
});

// ── CV Screening ──────────────────────────────────────────────────────────────

router.post("/applications/:id/screen", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = ScreenApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  const notesText = [
    parsed.data.notes ?? "",
    parsed.data.strengths?.length ? `Strengths: ${parsed.data.strengths.join("; ")}` : "",
    parsed.data.gaps?.length ? `Gaps: ${parsed.data.gaps.join("; ")}` : "",
    parsed.data.mustHaveScore ? `Must-have score: ${parsed.data.mustHaveScore}` : "",
  ].filter(Boolean).join("\n");

  let newStage = app.stage;
  if (parsed.data.recommendation === "advance" && app.stage === "applied") newStage = "screening";
  if (parsed.data.recommendation === "reject") newStage = "rejected";

  const [updated] = await db
    .update(applicationsTable)
    .set({ fitScore: parsed.data.fitScore, notes: notesText, stage: newStage, updatedAt: new Date() })
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));

  if (newStage !== app.stage) {
    await db.insert(activityLogTable).values({
      type: "screening_completed",
      description: `${candidate?.name ?? "Candidate"} screened for ${job?.title ?? "job"} — ${parsed.data.recommendation} (score: ${parsed.data.fitScore})`,
      candidateName: candidate?.name ?? null,
      jobTitle: job?.title ?? null,
    });
  }

  res.json({ ...updated, job: { ...(job ?? {}), applicantCount: 0 }, candidate: candidate ?? {} });
});

export default router;
