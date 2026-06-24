export interface Launch {
  id: string;
  projectId: string;
  launchTitle: string;
  launchDescription: string | null;
  launchStory: string | null;
  websiteUrl: string | null;
  videoUrl: string | null;
  launchDate: string | null;
  status: 'draft' | 'published';
  followerCount?: number;
  createdAt: string;
}

export interface LaunchScreenshot {
  id: string;
  launchId: string;
  imageUrl: string;
  displayOrder: number;
}

export interface LaunchFollower {
  id: string;
  launchId: string;
  userId: string;
  createdAt: string;
}

export interface LaunchFormValues {
  launchTitle: string;
  launchDescription: string;
  websiteUrl: string;
  videoUrl: string;
  launchStory: string;
  status: 'draft' | 'published';
}

/** A launch enriched with the project context shown on marketplace surfaces. */
export interface LaunchListItem extends Launch {
  projectTitle: string | null;
  projectStage: string | null;
  teamCount: number;
}
