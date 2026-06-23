/**
 * Client-side permission helpers. These mirror the workspace RBAC and are used
 * for UI gating only — the database RLS policies are the real source of truth.
 * Never trust client-side authorization (see docs/06_Technical_Architecture.md).
 */

import type { ProjectRole } from '@/lib/constants';
import type { Project, ProjectMember } from '@/types/project';

export function roleRank(role: ProjectRole): number {
  return { Owner: 3, Admin: 2, Contributor: 1, Viewer: 0 }[role];
}

export function memberRole(
  members: ProjectMember[],
  userId: string,
): ProjectRole | null {
  return members.find((m) => m.userId === userId)?.role ?? null;
}

export function canEditProject(project: Project, userId: string, members: ProjectMember[]) {
  if (project.ownerId === userId) return true;
  const role = memberRole(members, userId);
  return role === 'Admin';
}

export function canManageMembers(project: Project, userId: string, members: ProjectMember[]) {
  return canEditProject(project, userId, members);
}

export function canViewWorkspace(project: Project, userId: string, members: ProjectMember[]) {
  if (project.visibility === 'Public') return true;
  if (project.ownerId === userId) return true;
  return members.some((m) => m.userId === userId && m.membershipStatus === 'active');
}
