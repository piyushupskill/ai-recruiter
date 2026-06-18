import type { Job, Candidate } from "@workspace/db";

// Skill taxonomy: maps common aliases/synonyms to canonical skill groups
const SKILL_TAXONOMY: Record<string, string[]> = {
  javascript: ["js", "javascript", "ecmascript", "es6", "es2015", "nodejs", "node.js", "node"],
  typescript: ["ts", "typescript"],
  react: ["react", "reactjs", "react.js", "react native"],
  python: ["python", "python3", "py"],
  java: ["java", "java8", "java11", "spring", "springboot", "spring boot"],
  "c#": ["c#", "csharp", "dotnet", ".net", "asp.net"],
  golang: ["go", "golang"],
  rust: ["rust", "rustlang"],
  sql: ["sql", "mysql", "postgresql", "postgres", "sqlite", "mssql", "tsql", "pl/sql"],
  nosql: ["mongodb", "mongo", "dynamodb", "cassandra", "redis", "elasticsearch", "couchdb"],
  aws: ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation", "eks", "ecs"],
  gcp: ["gcp", "google cloud", "bigquery", "gke", "cloud run"],
  azure: ["azure", "microsoft azure", "aks"],
  kubernetes: ["kubernetes", "k8s", "helm", "kubectl"],
  docker: ["docker", "containerization", "containers"],
  cicd: ["ci/cd", "cicd", "github actions", "jenkins", "gitlab ci", "circleci", "travis"],
  agile: ["agile", "scrum", "kanban", "jira", "sprint", "standup"],
  ml: ["machine learning", "ml", "deep learning", "neural networks", "tensorflow", "pytorch", "keras", "scikit-learn"],
  data: ["data science", "data analysis", "pandas", "numpy", "spark", "hadoop", "etl"],
  graphql: ["graphql", "apollo", "relay"],
  rest: ["rest", "restful", "api design", "openapi", "swagger"],
  vue: ["vue", "vuejs", "vue.js", "nuxt", "nuxtjs"],
  angular: ["angular", "angularjs"],
  devops: ["devops", "sre", "site reliability", "infrastructure", "terraform", "ansible"],
  testing: ["testing", "jest", "mocha", "cypress", "selenium", "unit testing", "tdd", "bdd", "playwright"],
  git: ["git", "github", "gitlab", "bitbucket", "version control"],
  linux: ["linux", "unix", "bash", "shell scripting", "ubuntu", "centos"],
  security: ["security", "appsec", "owasp", "penetration testing", "cybersecurity", "soc2"],
  leadership: ["leadership", "team lead", "tech lead", "engineering manager", "management", "mentoring", "mentorship"],
  communication: ["communication", "stakeholder management", "cross-functional", "presentation"],
};

// Career progression levels (ordered)
const SENIORITY_LEVELS: Record<string, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  principal: 5,
  director: 6,
  vp: 7,
  "c-level": 8,
};

const CAREER_PROGRESSION_SCORES: Record<string, number> = {
  accelerating: 100,
  steady: 75,
  lateral: 55,
  declining: 30,
  unknown: 50,
};

// Normalize a skill to lowercase, trimmed, for matching
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

// Get the canonical group for a skill (for semantic matching)
function getSkillGroups(skill: string): string[] {
  const normalized = normalizeSkill(skill);
  const groups: string[] = [normalized];
  for (const [group, aliases] of Object.entries(SKILL_TAXONOMY)) {
    if (aliases.some((a) => normalized.includes(a) || a.includes(normalized))) {
      groups.push(group);
    }
  }
  return groups;
}

// Compute semantic skill overlap between two skill lists
function computeSkillOverlap(
  candidateSkills: string[],
  targetSkills: string[],
): { matched: string[]; missing: string[]; score: number } {
  if (targetSkills.length === 0) return { matched: [], missing: [], score: 100 };

  const candidateGroups = candidateSkills.flatMap(getSkillGroups);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const target of targetSkills) {
    const targetGroups = getSkillGroups(target);
    const isMatch = targetGroups.some((tg) => candidateGroups.includes(tg));
    if (isMatch) {
      matched.push(target);
    } else {
      missing.push(target);
    }
  }

  const score = Math.round((matched.length / targetSkills.length) * 100);
  return { matched, missing, score };
}

// Experience score: how well does years of experience match the requirement?
function computeExperienceScore(
  candidateYears: number,
  minRequired: number,
  seniorityLevel: string,
): number {
  const seniorityExpected: Record<string, [number, number]> = {
    intern: [0, 1],
    junior: [0, 2],
    mid: [2, 5],
    senior: [5, 10],
    staff: [7, 15],
    principal: [10, 20],
    director: [8, 25],
    vp: [10, 30],
  };

  const [, idealMax] = seniorityExpected[seniorityLevel.toLowerCase()] ?? [minRequired, minRequired + 8];

  if (candidateYears < minRequired) {
    // Under-qualified: penalize proportionally
    const deficit = minRequired - candidateYears;
    return Math.max(0, Math.round(100 - (deficit / Math.max(minRequired, 1)) * 70));
  } else if (candidateYears <= idealMax) {
    // Sweet spot
    return 95;
  } else {
    // Overqualified: slight penalty (might leave soon)
    const excess = candidateYears - idealMax;
    return Math.max(60, Math.round(100 - excess * 3));
  }
}

// Career trajectory score
function computeCareerTrajectoryScore(
  candidate: Candidate,
  jobSeniority: string,
): number {
  const progressionScore =
    CAREER_PROGRESSION_SCORES[candidate.careerProgression ?? "unknown"] ?? 50;

  // Bonus for notable achievements
  const achievementBonus = Math.min(15, (candidate.notableAchievements?.length ?? 0) * 5);

  // Seniority alignment check
  const jobLevel = SENIORITY_LEVELS[jobSeniority.toLowerCase()] ?? 2;
  const titleNormalized = candidate.currentTitle.toLowerCase();

  let titleScore = 50;
  for (const [level, value] of Object.entries(SENIORITY_LEVELS)) {
    if (titleNormalized.includes(level)) {
      const diff = Math.abs(value - jobLevel);
      titleScore = diff === 0 ? 100 : diff === 1 ? 75 : diff === 2 ? 50 : 25;
      break;
    }
  }

  return Math.min(100, Math.round((progressionScore * 0.5) + (titleScore * 0.35) + achievementBonus));
}

// Cultural / behavioral signal score
function computeCulturalSignalScore(candidate: Candidate): number {
  const activity = candidate.activityScore ?? 50;
  const response = candidate.responseRate ?? 75;

  // Weighted: activity signals initiative, response rate signals reliability
  return Math.round(activity * 0.45 + response * 0.55);
}

// Availability score
function computeAvailabilityScore(candidate: Candidate, job: Job): number {
  let score = 80; // default

  // Remote match
  const remotePolicy = job.remotePolicy?.toLowerCase() ?? "hybrid";
  if (candidate.openToRemote) {
    if (remotePolicy === "remote") score += 15;
    else if (remotePolicy === "hybrid") score += 5;
  } else {
    if (remotePolicy === "remote") score -= 20;
  }

  // Availability urgency (faster = better, to a point)
  const weeks = candidate.availabilityWeeks ?? 4;
  if (weeks <= 2) score += 10;
  else if (weeks <= 4) score += 5;
  else if (weeks > 8) score -= 10;
  else if (weeks > 12) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// Build a human-readable verdict label from overall score
function getVerdict(score: number): string {
  if (score >= 88) return "Strong Hire";
  if (score >= 75) return "Good Fit";
  if (score >= 60) return "Possible";
  if (score >= 45) return "Weak Match";
  return "Not Suitable";
}

// Build reasoning text from the score breakdown
function buildReasoning(
  candidate: Candidate,
  job: Job,
  scores: {
    skillMatch: number;
    experience: number;
    careerTrajectory: number;
    culturalSignal: number;
    availability: number;
    overall: number;
  },
  requiredOverlap: { matched: string[]; missing: string[] },
  niceOverlap: { matched: string[] },
): string {
  const parts: string[] = [];

  // Skill narrative
  if (requiredOverlap.matched.length > 0) {
    parts.push(
      `Covers ${requiredOverlap.matched.length} of ${job.requiredSkills.length} required skills (${requiredOverlap.matched.slice(0, 3).join(", ")}${requiredOverlap.matched.length > 3 ? "…" : ""}).`,
    );
  }
  if (requiredOverlap.missing.length > 0) {
    parts.push(
      `Missing required: ${requiredOverlap.missing.slice(0, 3).join(", ")}.`,
    );
  }
  if (niceOverlap.matched.length > 0) {
    parts.push(
      `Bonus: also has ${niceOverlap.matched.slice(0, 2).join(", ")}.`,
    );
  }

  // Experience narrative
  if (candidate.yearsExperience < job.minYearsExperience) {
    parts.push(
      `${candidate.yearsExperience} yrs exp — ${job.minYearsExperience - candidate.yearsExperience} yr(s) short of the ${job.minYearsExperience}-yr minimum.`,
    );
  } else {
    parts.push(
      `${candidate.yearsExperience} yrs exp meets the ${job.minYearsExperience}-yr minimum.`,
    );
  }

  // Behavioral signals
  if ((candidate.activityScore ?? 0) >= 80) {
    parts.push("High activity score suggests strong initiative.");
  } else if ((candidate.activityScore ?? 0) < 40) {
    parts.push("Low activity score — engagement may be a concern.");
  }

  if ((candidate.responseRate ?? 0) >= 85) {
    parts.push("Excellent response rate indicates reliability.");
  }

  // Career trajectory
  if (candidate.careerProgression === "accelerating") {
    parts.push("Career trajectory is accelerating — shows strong growth momentum.");
  } else if (candidate.careerProgression === "declining") {
    parts.push("Career trajectory shows a declining pattern — worth exploring.");
  }

  if ((candidate.notableAchievements?.length ?? 0) > 0) {
    parts.push(`Notable: ${candidate.notableAchievements![0]}.`);
  }

  return parts.join(" ");
}

// Build strength highlights
function buildStrengths(
  candidate: Candidate,
  requiredOverlap: { matched: string[] },
  niceOverlap: { matched: string[] },
  scores: Record<string, number>,
): string[] {
  const strengths: string[] = [];

  if (requiredOverlap.matched.length > 0) {
    strengths.push(`${requiredOverlap.matched.length} required skills matched`);
  }
  if (niceOverlap.matched.length > 0) {
    strengths.push(`${niceOverlap.matched.length} bonus skills`);
  }
  if (scores.experience >= 90) strengths.push("Strong experience level");
  if (scores.experience >= 85 && scores.experience < 90) strengths.push("Solid years of experience");
  if ((candidate.activityScore ?? 0) >= 80) strengths.push("High activity signal");
  if ((candidate.responseRate ?? 0) >= 85) strengths.push("Excellent response rate");
  if (candidate.careerProgression === "accelerating") strengths.push("Accelerating career trajectory");
  if ((candidate.notableAchievements?.length ?? 0) >= 2) strengths.push("Multiple notable achievements");
  if (candidate.openToRemote) strengths.push("Open to remote work");
  if ((candidate.availabilityWeeks ?? 99) <= 2) strengths.push("Available immediately");

  return strengths.slice(0, 5);
}

// Build gap highlights
function buildGaps(
  candidate: Candidate,
  job: Job,
  requiredOverlap: { missing: string[] },
  scores: Record<string, number>,
): string[] {
  const gaps: string[] = [];

  if (requiredOverlap.missing.length > 0) {
    gaps.push(`Missing: ${requiredOverlap.missing.slice(0, 3).join(", ")}`);
  }
  if (candidate.yearsExperience < job.minYearsExperience) {
    gaps.push(`${job.minYearsExperience - candidate.yearsExperience} yr(s) experience gap`);
  }
  if (scores.experience >= 80 && candidate.yearsExperience > (job.minYearsExperience + 8)) {
    gaps.push("Potentially overqualified");
  }
  if ((candidate.activityScore ?? 50) < 40) gaps.push("Low activity score");
  if ((candidate.responseRate ?? 75) < 50) gaps.push("Low response rate");
  if (candidate.careerProgression === "declining") gaps.push("Declining career trajectory");
  if ((candidate.availabilityWeeks ?? 0) > 12) gaps.push("Long availability lead time");

  return gaps.slice(0, 4);
}

export interface RankedCandidate {
  candidateId: number;
  jobId: number;
  overallScore: number;
  skillMatchScore: number;
  experienceScore: number;
  careerTrajectoryScore: number;
  culturalSignalScore: number;
  availabilityScore: number;
  rank: number;
  verdict: string;
  reasoning: string;
  strengthHighlights: string[];
  gapHighlights: string[];
  candidateName: string;
  candidateTitle: string;
  candidateSkills: string[];
}

// Weights for the overall score
const WEIGHTS = {
  skillMatch: 0.38,
  experience: 0.22,
  careerTrajectory: 0.18,
  culturalSignal: 0.13,
  availability: 0.09,
};

export function rankCandidates(job: Job, candidates: Candidate[]): RankedCandidate[] {
  const scored = candidates.map((candidate) => {
    const requiredOverlap = computeSkillOverlap(candidate.skills, job.requiredSkills);
    const niceOverlap = computeSkillOverlap(candidate.skills, job.niceToHaveSkills);

    const skillMatchScore = Math.round(
      requiredOverlap.score * 0.75 + niceOverlap.score * 0.25,
    );
    const experienceScore = computeExperienceScore(
      candidate.yearsExperience,
      job.minYearsExperience,
      job.seniorityLevel,
    );
    const careerTrajectoryScore = computeCareerTrajectoryScore(candidate, job.seniorityLevel);
    const culturalSignalScore = computeCulturalSignalScore(candidate);
    const availabilityScore = computeAvailabilityScore(candidate, job);

    const overallScore = Math.round(
      skillMatchScore * WEIGHTS.skillMatch +
      experienceScore * WEIGHTS.experience +
      careerTrajectoryScore * WEIGHTS.careerTrajectory +
      culturalSignalScore * WEIGHTS.culturalSignal +
      availabilityScore * WEIGHTS.availability,
    );

    const scores = {
      skillMatch: skillMatchScore,
      experience: experienceScore,
      careerTrajectory: careerTrajectoryScore,
      culturalSignal: culturalSignalScore,
      availability: availabilityScore,
      overall: overallScore,
    };

    const verdict = getVerdict(overallScore);
    const reasoning = buildReasoning(candidate, job, scores, requiredOverlap, niceOverlap);
    const strengthHighlights = buildStrengths(candidate, requiredOverlap, niceOverlap, scores);
    const gapHighlights = buildGaps(candidate, job, requiredOverlap, scores);

    return {
      candidateId: candidate.id,
      jobId: job.id,
      overallScore,
      skillMatchScore,
      experienceScore,
      careerTrajectoryScore,
      culturalSignalScore,
      availabilityScore,
      rank: 0,
      verdict,
      reasoning,
      strengthHighlights,
      gapHighlights,
      candidateName: candidate.name,
      candidateTitle: candidate.currentTitle,
      candidateSkills: candidate.skills,
    };
  });

  // Sort descending by overall score
  scored.sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks
  scored.forEach((r, i) => {
    r.rank = i + 1;
  });

  return scored;
}
