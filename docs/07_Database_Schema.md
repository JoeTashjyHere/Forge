# Forge Database Schema

Version 1.0

## Philosophy

Everything in Forge revolves around Users, Projects, Teams, Matches, AI, and
Launches. The schema should prioritize Simplicity, Flexibility, Extensibility,
and Security.

All tables should implement: UUID primary keys, Created timestamps, Updated
timestamps, Row Level Security (RLS).

> Implementation note: the live schema is in `supabase/migrations/`. Lookup
> values (build stages, archetypes, availability, skills, interests) are stored
> by name on the relevant rows and seeded via `supabase/seed.sql`.

---

## Core Tables

### users
`id (UUID)`, `email`, `first_name`, `last_name`, `display_name`,
`profile_photo_url`, `bio`, `occupation`, `company`, `location`, `timezone`,
`years_experience`, `build_stage`, `builder_archetype`, `availability`,
`is_verified`, `profile_visibility`, `onboarding_completed`, `created_at`,
`updated_at`.

### builder_archetypes
`id`, `name`, `description`. Examples: Visionary, Builder, Operator, Designer,
Seller, Marketer, Analyst.

### build_stages
`id`, `name`, `description`, `sort_order`. Examples: Explorer, Idea, Validation,
Building, Launch, Growth, Business.

### availability_levels
`id`, `label`, `min_hours`, `max_hours`. Examples: 1-5, 5-10, 10-20, 20+.

### skills
`id`, `name`, `category`, `description`.

### user_skills
`id`, `user_id`, `skill_id`/`skill_name`, `proficiency_level`,
`years_experience`, `created_at`.

### interests / user_interests
Master interest catalog and the many-to-many join with users.

### user_goals
`id`, `user_id`, `goal_type`.

### partner_preferences
`id`/`user_id`, weight columns (`reliability_weight`, `availability_weight`,
`experience_weight`, `leadership_weight`, `communication_weight`,
`technical_weight`), `local_preference`, `preferred_team_size`,
`preferred_stage`, `updated_at`.

---

## Projects

### projects
`id`, `owner_id`, `title`, `slug`, `description`, `industry`, `project_stage`,
`visibility`, `health_status`, `time_commitment`, `looking_for_members`,
`launch_status`, `created_at`, `updated_at`.

### project_stages
`id`, `name`, `description`, `sort_order`. Examples: Idea, Validation, Prototype,
MVP, Launch, Growth, Revenue.

### project_skills_needed
`id`, `project_id`, `skill_id`/`skill_name`, `priority`, `required_level`.

### project_members
`id`, `project_id`, `user_id`, `role`, `membership_status`, `joined_at`. Roles:
Owner, Admin, Contributor, Viewer.

### project_milestones
`id`, `project_id`, `title`, `description`, `due_date`, `status`,
`completion_percentage`, `created_at`, `updated_at`.

### tasks
`id`, `project_id`, `assigned_user_id`, `title`, `description`, `priority`,
`status`, `due_date`, `created_at`, `updated_at`.

### project_files
`id`, `project_id`, `uploaded_by`, `file_name`, `file_url`, `file_type`,
`created_at`.

### project_activity
`id`, `project_id`, `user_id`, `activity_type`, `activity_description`,
`created_at`.

---

## Matching

### matches
`id`, `user_id`, `target_user_id`, `match_score`, `stage_fit_score`,
`skill_fit_score`, `compatibility_score`, `status`, `generated_at`.

### project_matches
`id`, `project_id`, `user_id`, `match_score`, `reasoning_summary`,
`generated_at`.

---

## Messaging

### messages
`id`, `sender_id`, `recipient_id`, `message_text`, `read_status`, `created_at`.

### conversations
`id`, `conversation_type`, `created_at`, `updated_at`.

### conversation_members
`id`, `conversation_id`, `user_id`, `joined_at`.

### workspace_messages
`id`, `project_id`, `sender_id`, `message_text`, `created_at`.

---

## AI

### ai_sessions
`id`, `user_id`, `project_id`, `session_type`, `created_at`, `updated_at`.

### ai_messages
`id`, `session_id`, `role`, `content`, `created_at`.

### ai_roadmaps
`id`, `project_id`, `generated_by`, `roadmap_json`, `created_at`.

### weekly_checkins
`id`, `user_id`, `project_id`, `accomplishments`, `blockers`, `next_steps`,
`created_at`.

---

## Reputation & Health

### builder_reputation (Version 2)
`id`/`user_id`, `reliability_score`, `execution_score`, `collaboration_score`,
`expertise_score`, `last_calculated_at`.

### project_health
`id`/`project_id`, `health_score`, `health_status`, `risk_factors`,
`last_updated`.

---

## Launches

### launches
`id`, `project_id`, `launch_title`, `launch_description`, `website_url`,
`video_url`, `launch_date`, `status`, `created_at`.

### launch_screenshots
`id`, `launch_id`, `image_url`, `display_order`, `created_at`.

### launch_followers
`id`, `launch_id`, `user_id`, `created_at`.

---

## Platform

### notifications
`id`, `user_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`.

### analytics_events
`id`, `user_id`, `event_name`, `event_data`, `created_at`.

---

## Future Graph Layer

Future versions will create `builder_relationships`, `project_relationships`,
`team_relationships`, and `launch_outcomes` — the foundation of the Forge
Collaboration Graph and long-term moat.
