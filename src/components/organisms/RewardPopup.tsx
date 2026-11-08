import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { useMyRewards } from "../../hooks/useRewards";
import type { RewardCard } from "../../types/rewards";
import { ScratchRewardModal } from "./ScratchRewardModal";

const SEEN_KEY = "rewards.popup-seen";
// Cards already popped up during this visit, so a slow save can never bring the same card back.
const seenNow = new Set<string>();

async function readSeen(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * On Home: when a delivered order has just won a scratch card, it pops up once to be scratched (like a gift card in a shopping
 * app). "Later" keeps it in Scratch cards; the pop-up never asks about the same card twice.
 */
export function RewardPopup() {
  const { data: cards } = useMyRewards();
  const [card, setCard] = useState<RewardCard | null>(null);

  useEffect(() => {
    const fresh = (cards ?? []).filter((item) => item.status === "new");
    if (fresh.length === 0 || card) return;
    let cancelled = false;
    void readSeen().then((seen) => {
      const next = fresh.find((item) => !seen.includes(item.id) && !seenNow.has(item.id));
      if (!cancelled && next) setCard(next);
    });
    return () => { cancelled = true; };
  }, [cards, card]);

  const close = () => {
    const shown = card;
    setCard(null);
    if (!shown) return;
    seenNow.add(shown.id);
    void readSeen().then((seen) => AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen, shown.id].slice(-100))).catch(() => undefined));
  };

  return <ScratchRewardModal card={card} onClose={close} />;
}
