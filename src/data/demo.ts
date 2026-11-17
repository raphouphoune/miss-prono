import type { Feature, LeaderboardEntry } from "@/types";

export const demoLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "Lauuurette", initials: "L", points: 370, trend: "up" },
  { rank: 2, username: "MissDream", initials: "M", points: 360, trend: "same" },
  { rank: 3, username: "MarineProno", initials: "M", points: 350, trend: "up" },
  { rank: 4, username: "Charlotte_12", initials: "C", points: 340, trend: "down" },
  { rank: 5, username: "PronoQueen", initials: "P", points: 330, trend: "same" }
];

export const features: Feature[] = [
  {
    eyebrow: "LE JEU",
    title: "Pronostiquez le classement",
    description: "Composez votre Top 12, placez vos favorites et tentez de trouver le classement exact.",
    icon: "crown"
  },
  {
    eyebrow: "ENTRE AMIS",
    title: "Défiez votre entourage",
    description: "Créez une ligue privée, invitez vos proches et comparez vos intuitions.",
    icon: "users"
  },
  {
    eyebrow: "EN TOUTE DISCRÉTION",
    title: "Gardez vos choix secrets",
    description: "Vos pronostics restent privés jusqu'à la clôture officielle du jeu.",
    icon: "lock"
  }
];
