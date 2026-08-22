import React from 'react';
import { motion } from 'framer-motion';
import { AdAvailability, AdConfig } from '../ads/types';

interface AdCardProps {
  config: AdConfig | null;
  status: AdAvailability | null;
  loading: boolean;
  watching: boolean;
  message: string | null;
  onWatch: () => void;
}

const getCooldownText = (cooldownUntil: number | null): string | null => {
  if (!cooldownUntil) return null;
  const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
  if (seconds <= 0) return null;
  return `${seconds}s until next ad`;
};

export const AdCard: React.FC<AdCardProps> = ({
  config,
  status,
  loading,
  watching,
  message,
  onWatch,
}) => {
  const cooldownText = getCooldownText(status?.cooldownUntil ?? null);
  const disabled = loading || watching || !config?.enabled || !status?.isAvailable;

  return (
    <motion.section
      className="w-full max-w-sm rounded-2xl border border-bronze-600/60 bg-[#111111] p-4 shadow-[0_0_24px_rgba(212,175,55,0.15)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-bronze-400">WATCH ADS</h2>
          <p className="text-xs text-gray-400">+{((config?.rewardMicro ?? 0) / 1_000_000).toFixed(3)} CROWN • +{config?.rewardXp ?? 0} XP</p>
        </div>
        <span className="rounded-full border border-bronze-600/60 px-2 py-1 text-[10px] uppercase tracking-wide text-bronze-400">
          {config?.provider ?? '...'}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-300">
        <p>
          Daily: <span className="text-white">{status?.dailyRewardsCount ?? 0} / {status?.dailyUserLimit ?? config?.dailyUserLimit ?? 0}</span>
        </p>
        {cooldownText ? <p className="text-amber-300">{cooldownText}</p> : null}
        {message ? <p className="text-gray-200">{message}</p> : null}
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-bronze-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onWatch}
        disabled={disabled}
      >
        {watching ? 'WATCHING...' : 'WATCH'}
      </button>
    </motion.section>
  );
};
