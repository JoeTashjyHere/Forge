# Forge Matching Engine

Version 1.0

## Purpose

The Forge Matching Engine exists to maximize the probability that users
successfully build and launch projects.

LinkedIn optimizes for connections. Dating apps optimize for attraction. Forge
optimizes for successful collaboration and execution. The goal is not to create
the most matches — the goal is to create the most successful builds.

---

## Core Matching Philosophy

Most platforms match on job titles, skills, geography, and interests. Forge
matches on:

- Stage Fit
- Team Needs
- Execution Potential
- Behavioral Signals
- Project Success Probability

The objective is to answer: *"Who is most likely to help this person
successfully build something?"*

---

## Matching Objects

- **Builder-to-Builder** — Recommend individual collaborators (e.g. Founder + Engineer).
- **Builder-to-Project** — Recommend projects users should join.
- **Project-to-Builder** — Recommend builders to projects (e.g. project needs a frontend engineer).

---

## Build Stages

**Personal Build Stages:** Explorer, Idea, Validation, Building, Launch, Growth,
Business.

**Project Build Stages:** Idea, Validation, Prototype, MVP, Launch, Growth,
Revenue.

Build stage is one of the most important matching variables.

---

## Matching Framework

Version 1 uses weighted scoring. No machine learning is required initially.

### Match Score Formula — Suggested V1 Weights

| Factor | Weight |
| --- | --- |
| Stage Fit | 25% |
| Missing Skill Coverage | 20% |
| Reliability | 15% |
| Interest Alignment | 10% |
| Availability Alignment | 10% |
| Compatibility Score | 10% |
| Experience Diversity | 5% |
| Location Preference | 5% |

### Stage Fit
Determine whether a builder is useful at the project's current stage. Idea stage
needs Product, Validation, Design. Launch stage needs Marketing, Sales, Growth.
Growth stage needs Operations, Revenue, Customer Success. Stage Fit is one of
the strongest signals.

### Missing Skill Coverage
Identify gaps within teams. A team of two engineers and a PM is missing Design
and Marketing — designers and marketers receive higher match scores.

### Interest Alignment
Measure overlap in industries, topics, and project interests.

### Availability Alignment
Prevent mismatched expectations (e.g. 20+ hrs/week vs 1-5 hrs/week).

### Experience Diversity
Balanced teams often outperform identical teams. Four Visionaries is a bad team;
Visionary + Builder + Operator + Marketer is a good team.

### User Preferences
Users may customize matching priorities (Reliability, Communication, Experience,
Availability, Leadership) and specify local/remote preference, team size, and
project stage. User preferences influence recommendations but never fully
override Forge recommendations.

---

## Compatibility Score

Compatibility is not popularity — it is a prediction of successful
collaboration.

**V1 signals:** Availability overlap, communication preferences, stage
preferences, builder archetypes, interests.

**V2 signals:** Project outcomes, team retention, milestone completion,
collaboration history.

### Builder Archetype Compatibility

- **Visionary** — Strong with Builders, Operators. Weak with additional Visionaries.
- **Builder** — Strong with Visionaries, Designers, Operators.
- **Operator** — Strong with Visionaries, Builders.
- **Designer** — Strong with Builders, Product Thinkers.
- **Marketer** — Strong with Launch Stage Projects.
- **Seller** — Strong with Growth Stage Projects.
- **Analyst** — Strong with Validation Stage Projects.

---

## Reliability System

**Version 1:** No reliability score at onboarding. All users begin as *Unproven
Builder*. The system should never pretend to know what it does not know.

**Version 2:** Reliability calculated using milestone completion, responsiveness,
participation, team retention, attendance, and consistency.

---

## Behavioral Signals

Behavior eventually becomes more important than profile data: message response
time, milestone completion, task completion, project abandonment, team
retention, activity consistency. Behavioral signals should gradually outweigh
self-reported information.

---

## Match Presentation

Users should not see raw calculations. Example:

> **92% Match**
> - Complements your skill set
> - Similar availability
> - Shared interest in AI
> - Strong fit for current project stage

---

## Future Matching Engine

Version 2 introduces machine learning. The system learns which teams succeed,
which archetypes work together, which skill combinations launch products, and
which builders consistently execute.

Long-term goal: predict team success before teams form.

## Ultimate Goal

The matching engine should become the most accurate system for answering: *"Who
should build together?"*
