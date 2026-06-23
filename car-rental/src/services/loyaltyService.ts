import { addToCollection, updateDocument, getDocumentsByField, collections } from "@/lib/firestore";
import { ClientPoints } from "@/lib/types";

const POINTS_PER_DT = 10;
const LEVELS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 5000,
};

export function getLevel(points: number): "bronze" | "silver" | "gold" | "platinum" {
  if (points >= LEVELS.platinum) return "platinum";
  if (points >= LEVELS.gold) return "gold";
  if (points >= LEVELS.silver) return "silver";
  return "bronze";
}

export function getNextLevel(points: number): { level: string; pointsNeeded: number } | null {
  if (points < LEVELS.silver) return { level: "فضي", pointsNeeded: LEVELS.silver - points };
  if (points < LEVELS.gold) return { level: "ذهبي", pointsNeeded: LEVELS.gold - points };
  if (points < LEVELS.platinum) return { level: "بلاتينيوم", pointsNeeded: LEVELS.platinum - points };
  return null;
}

export async function addPoints(
  clientId: string,
  clientName: string,
  cin: string,
  phone: string,
  contractAmount: number
): Promise<void> {
  const points = Math.floor(contractAmount * POINTS_PER_DT);
  if (points <= 0) return;

  const existing = await getDocumentsByField<ClientPoints>(collections.clientPoints, "clientId", clientId);
  if (existing.length > 0) {
    const record = existing[0];
    const newPoints = record.points + points;
    await updateDocument(collections.clientPoints, record.id, {
      points: newPoints,
      totalRents: record.totalRents + 1,
      totalSpent: record.totalSpent + contractAmount,
      level: getLevel(newPoints),
    });
  } else {
    const newPoints = points;
    await addToCollection(collections.clientPoints, {
      clientId,
      clientName,
      cin,
      phone,
      points: newPoints,
      totalRents: 1,
      totalSpent: contractAmount,
      level: getLevel(newPoints),
    } as any);
  }
}

export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    bronze: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    silver: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
    gold: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    platinum: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  };
  return colors[level] || colors.bronze;
}

export function getLevelLabel(level: string, lang: "ar" | "fr"): string {
  const labels: Record<string, Record<string, string>> = {
    bronze: { ar: "برونزي", fr: "Bronze" },
    silver: { ar: "فضي", fr: "Argent" },
    gold: { ar: "ذهبي", fr: "Or" },
    platinum: { ar: "بلاتينيوم", fr: "Platine" },
  };
  return labels[level]?.[lang] || level;
}

export { LEVELS, POINTS_PER_DT };
