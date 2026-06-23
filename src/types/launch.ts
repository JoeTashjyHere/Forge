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
