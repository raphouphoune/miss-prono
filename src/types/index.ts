export type LeaderboardEntry = {
  rank: number;
  username: string;
  initials: string;
  points: number;
  trend: "up" | "down" | "same";
};

export type Feature = {
  eyebrow: string;
  title: string;
  description: string;
  icon: "crown" | "users" | "lock";
};

export type Candidate = {
  id: string;
  slug: string;
  number: number;
  name: string;
  region: string;
  imageSrc: string;
  age?: number;
  heightCm?: number;
  hometown?: string;
  education?: string;
  occupation?: string;
  electedOn?: string;
  electedAt?: string;
  passions?: string[];
  commitments?: string[];
  biography?: string;
  instagramUrl?: string;
  officialSourceUrl: string;
  profileSourceUrl: string;
  photoSourceUrl: string;
};
