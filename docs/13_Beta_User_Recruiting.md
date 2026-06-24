# 13 — Beta User Recruiting

How we find, invite, onboard, and learn from the first 50–100 Forge builders.
Pairs with `12_Beta_Launch_Runbook.md` (the technical/ops side). The goal of
this first cohort is **learning and momentum**, not growth — we want builders
who will actually start a project and tell us the truth.

---

## 1. Ideal first 100 users

We are optimizing for people who will *use the core loop*: start a project,
plan it, find teammates, and push toward a launch.

**Strong fit**
- Indie hackers / solo founders with an idea they haven't shipped yet.
- "Idea-rich, time-poor" operators who need structure and a teammate.
- Designers, engineers, and marketers who want to join a project, not start one
  (we need both sides of matching to work).
- People mid-build who are stuck on the next step (great for the AI coach).
- Builders in communities: accelerator alumni, hackathon participants,
  build-in-public folks, niche Slack/Discord groups.

**Weak fit (defer for now)**
- Pure spectators with no intent to build in the next 4 weeks.
- Large teams that already have full tooling and process.
- Anyone looking for paid gigs / a job board (not what Forge is yet).

**Cohort shape to aim for**
- ~50% builders/engineers, ~20% designers, ~20% operators/PMs, ~10% marketers.
- Mix of "starting something new" and "looking to join" so matching has supply.
- Bias toward people who reply fast and give feedback — reliability over reach.

---

## 2. Outreach script

Keep it personal, short, and specific. Always reference *why them*.

**DM / email (cold-warm)**
> Subject: building something? want you in the Forge beta
>
> Hi {first name} — I'm building Forge, a place where people turn ideas into
> real projects: an AI coach plans the work, we match you with the right
> teammates, and you get a clear path to launch.
>
> I'm letting in the first 100 builders and thought of you because {specific
> reason — your project X / you mentioned wanting to build Y / your design work}.
>
> Want in? Here's the 60-second signup: {link}/beta — or reply and I'll add you
> directly. Would love your honest take while it's early.

**One-liner for communities / build-in-public**
> Forge turns "I have an idea" into a shipped project — AI roadmap, teammate
> matching, launch tracking. Opening the beta to 100 builders. Grab a spot:
> {link}/beta

**Referral ask (after a good first session)**
> Who's one person you'd actually want to build alongside? I'll save them a beta
> spot.

---

## 3. Beta onboarding script

Goal of first session: the user leaves with a project created and a clear next
action. Walk them (live or async) through:

1. **Welcome + framing** — "Forge is about momentum. By the end of this you'll
   have a real project and a next step."
2. **Sign up** → onboarding (skills, archetype, what they want to build).
3. **Create a project** (or join one if they're a contributor).
4. **Generate an AI roadmap** and add it to the workspace — show how milestones
   and tasks appear.
5. **Find a teammate** — open Matches / Team Builder and explain the "fills a
   real gap" reasoning.
6. **Set the next action** — agree on the one thing they'll do this week.
7. **Tell them how to give feedback** — Profile → Share feedback (or the
   feedback link). Make it clear we read every response.

Follow up within 48 hours: "Did you do the next step? What got in the way?"

---

## 4. Feedback questions

In-app (Profile → Share feedback) captures:
- **Rating (1–5):** Overall, how would you rate Forge?
- **Would you use Forge again?** (yes/no)
- **What worked well?**
- **What confused you?**
- **What did you expect but not find?**

Deeper questions for live interviews (pick 3–4):
- What were you hoping Forge would do for you?
- Where did you get stuck or drop off?
- What did you do right after using it (if anything)?
- What would make this a "must-use" for your next project?
- Who else should be using this?

---

## 5. Success metrics

We measure outcomes, not engagement (see `01_Vision.md`). Track via
`analytics_events` and the beta tables.

**Activation (first session)**
- % of signups that complete onboarding (`onboarding_completed`).
- % that create a project (`project_created`).
- % that generate a roadmap and add it to the workspace
  (`roadmap_generated`, `roadmap_added_to_workspace`).

**Core value**
- % that complete at least one milestone (`milestone_completed`).
- % that invite or message a teammate (`teammate_invited`, `message_sent`).
- # of projects that reach a published launch (`launch_published`).

**Retention & sentiment**
- Week-2 return rate.
- Beta feedback: average rating, % "would use again".
- Qualitative: recurring confusion themes, top requested missing things.

**Funnel health (recruiting)**
- `beta_invites` by status: new → invited → onboarded (and rejected).
- Invite → onboarded conversion rate.

**First cohort targets (directional, not hard gates)**
- 60%+ complete onboarding; 40%+ create a project; 25%+ complete a milestone;
  ≥5 launches published; average rating ≥4.0.

---

## 6. Weekly review process

A 60-minute standing review while the beta runs.

1. **Pull the numbers** (10 min) — invite funnel, activation %s, launches,
   average rating. Compare to last week.
2. **Read all feedback** (15 min) — every `beta_feedback` row + interview notes.
   Tag each as: confusion, missing feature, bug, or praise.
3. **Find the top 3 friction points** (10 min) — where people stall or get
   confused most. Prioritize by how many users hit it × severity.
4. **Decide actions** (15 min) — pick at most 3 fixes for the week. Bias toward
   removing friction in the activation path over adding features.
5. **Triage the invite list** (5 min) — move `new` → `invited`, send the next
   small wave (10–20), mark `onboarded` as people complete a first session.
6. **Close the loop** (5 min) — reply to feedback givers with what we changed.
   This is the highest-leverage retention move in an early beta.

Operational notes:
- Invite in small waves so support stays personal and issues stay contained.
- Keep a running "known issues / limitations" list (see `12` §7) and share it
  with new invitees so expectations are set.
- Admin view: Profile → **Beta admin** (admins only) to manage statuses and read
  feedback. Add admins in two places: `EXPO_PUBLIC_ADMIN_EMAILS` (UI gate) and
  the `admin_users` table (RLS / data gate).
```
