import type { ProfileVisibility, UserProfile } from '@/types/user';

/** Maps a snake_case `users` row from Supabase into a typed UserProfile. */
export function mapProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    displayName: row.display_name ?? null,
    profilePhotoUrl: row.profile_photo_url ?? null,
    bio: row.bio ?? null,
    occupation: row.occupation ?? null,
    company: row.company ?? null,
    location: row.location ?? null,
    timezone: row.timezone ?? null,
    yearsExperience: row.years_experience ?? null,
    buildStage: row.build_stage ?? null,
    builderArchetype: row.builder_archetype ?? null,
    availability: row.availability ?? null,
    isVerified: Boolean(row.is_verified),
    profileVisibility: (row.profile_visibility as ProfileVisibility) ?? 'public',
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function fullName(profile: Pick<UserProfile, 'firstName' | 'lastName' | 'displayName'>) {
  if (profile.displayName) return profile.displayName;
  const parts = [profile.firstName, profile.lastName].filter(Boolean);
  return parts.join(' ') || 'Builder';
}
