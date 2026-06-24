export type BetaInviteStatus = 'new' | 'invited' | 'onboarded' | 'rejected';

export interface BetaInvite {
  id: string;
  name: string;
  email: string;
  role: string | null;
  builderType: string | null;
  building: string | null;
  status: BetaInviteStatus;
  createdAt: string;
}

export interface BetaInviteInput {
  name: string;
  email: string;
  role: string;
  builderType: string;
  building: string;
}

export interface BetaFeedback {
  id: string;
  userId: string | null;
  whatWorked: string | null;
  whatConfused: string | null;
  whatExpected: string | null;
  wouldUseAgain: boolean | null;
  rating: number | null;
  createdAt: string;
}

export interface BetaFeedbackInput {
  whatWorked: string;
  whatConfused: string;
  whatExpected: string;
  wouldUseAgain: boolean | null;
  rating: number;
}
