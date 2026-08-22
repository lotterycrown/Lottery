import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Crown } from '../components/Crown';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { CoinParticles } from '../components/CoinParticles';
import { TapReward } from '../components/TapReward';
import { BottomNavigation } from '../components/BottomNavigation';
import { useGameState } from '../hooks/useGameState';
import { useTapEffect } from '../hooks/useTapEffect';
import { useAuthStore } from '../hooks/useAuthStore';
import { useGameStore } from '../hooks/useGameStore';
import { adApi, referralApi, taskApi } from '../services/api';
import { AdConfig, ReferralInfo, Task } from '../types';

type Tab = 'crown' | 'tasks' | 'profile';
const MICRO_UNITS_PER_COIN = 1_000_000;
const toCoinAmount = (value: string): string => (Number(BigInt(value)) / MICRO_UNITS_PER_COIN).toFixed(3);

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('crown');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const { playerState, handleTap } = useGameState();
  const { tapEffect, triggerTap, updateParticles } = useTapEffect();
  const loadUser = useAuthStore((state) => state.loadUser);
  const gameError = useGameStore((state) => state.error);
  const clearGameError = useGameStore((state) => state.clearError);
  const pendingReward = useGameStore((state) => state.pendingReward);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    const response = await taskApi.getTasks();
    if (!response.success || !response.data) {
      setTasksLoading(false);
      setTasksError(response.error || 'Failed to load tasks');
      return;
    }
    setTasks(response.data);
    setTasksLoading(false);
  }, []);

  const loadReferralInfo = useCallback(async () => {
    setReferralLoading(true);
    setReferralError(null);
    const checkResponse = await referralApi.checkQualification();
    if (!checkResponse.success) {
      setReferralLoading(false);
      setReferralError(checkResponse.error || 'Failed to refresh referral status');
      return;
    }

    const response = await referralApi.getReferrals();
    if (!response.success || !response.data) {
      setReferralLoading(false);
      setReferralError(response.error || 'Failed to load referral data');
      return;
    }

    setReferralInfo(response.data);
    setReferralLoading(false);
  }, []);

  const loadAdConfig = useCallback(async () => {
    setAdLoading(true);
    setAdError(null);
    const response = await adApi.getAdConfig();
    if (!response.success || !response.data) {
      setAdLoading(false);
      setAdError(response.error || 'Failed to load ad config');
      return;
    }
    setAdConfig(response.data);
    setAdLoading(false);
  }, []);

  // Update particles every frame
  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [updateParticles]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (activeTab !== 'profile') {
      return;
    }
    void loadReferralInfo();
    void loadAdConfig();
  }, [activeTab, loadAdConfig, loadReferralInfo]);

  const handleCrownTap = async (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    triggerTap(x, y);
    const success = await handleTap();
    if (success) {
      void loadTasks();
    }
  };

  const handleClaimTask = useCallback(async (taskId: string) => {
    if (claimingTaskId) {
      return;
    }
    setClaimingTaskId(taskId);
    setTasksError(null);

    const response = await taskApi.claimTask(taskId, uuidv4());
    if (!response.success) {
      setClaimingTaskId(null);
      setTasksError(response.error || 'Failed to claim task');
      return;
    }

    await Promise.all([loadUser(), loadTasks()]);
    setClaimingTaskId(null);
  }, [claimingTaskId, loadTasks, loadUser]);

  const handleWatchAd = useCallback(async () => {
    if (!adConfig || !adConfig.configured || watchingAd) {
      return;
    }
    setWatchingAd(true);
    setAdError(null);
    const response = await adApi.recordAdView(adConfig.provider, undefined, undefined, uuidv4());
    if (!response.success) {
      setAdError(response.error || 'Failed to record ad reward');
      setWatchingAd(false);
      return;
    }
    await Promise.all([loadUser(), loadTasks()]);
    setWatchingAd(false);
  }, [adConfig, loadTasks, loadUser, watchingAd]);

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    const aCompleted = Boolean(a.progress?.completed);
    const bCompleted = Boolean(b.progress?.completed);
    const aClaimed = Boolean(a.progress?.claimed);
    const bClaimed = Boolean(b.progress?.claimed);
    if (aClaimed !== bClaimed) return aClaimed ? 1 : -1;
    if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;
    return a.title.localeCompare(b.title);
  }), [tasks]);

  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      return (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 text-white space-y-3">
          {tasksError && <div className="text-xs text-red-400">{tasksError}</div>}
          {tasksLoading ? <div className="text-sm text-gray-400">Loading tasks...</div> : null}
          {!tasksLoading && sortedTasks.length === 0 ? <div className="text-sm text-gray-400">No tasks available.</div> : null}
          {sortedTasks.map((task) => {
            const progress = task.progress;
            const current = progress?.currentCount ?? 0;
            const claimed = Boolean(progress?.claimed);
            const completed = Boolean(progress?.completed);
            const canClaim = completed && !claimed && claimingTaskId !== task.id;
            return (
              <div key={task.id} className="bg-dark-gray border border-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{task.title}</div>
                    <div className="text-xs text-gray-400">{task.requirement}</div>
                  </div>
                  <div className="text-xs text-amber-300">+{toCoinAmount(task.reward)}</div>
                </div>
                <div className="text-xs text-gray-300">
                  Progress: {Math.min(current, task.targetCount)}/{task.targetCount}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleClaimTask(task.id);
                  }}
                  disabled={!canClaim}
                  className="w-full rounded-md bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {claimingTaskId === task.id ? 'Claiming...' : claimed ? 'Claimed' : completed ? 'Claim Reward' : 'In Progress'}
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 text-white space-y-4">
          <div className="bg-dark-gray border border-gray-800 rounded-lg p-3 space-y-2">
            <div className="text-sm font-semibold">Referrals</div>
            {referralError ? <div className="text-xs text-red-400">{referralError}</div> : null}
            {referralLoading ? <div className="text-xs text-gray-400">Loading referral data...</div> : null}
            {!referralLoading && referralInfo ? (
              <>
                <div className="text-xs text-gray-300">Code: {referralInfo.referralCode}</div>
                <div className="text-xs text-gray-300 break-all">{referralInfo.referralLink || 'Referral link unavailable (set TELEGRAM_MINI_APP_URL).'}</div>
                <div className="text-xs text-gray-300">
                  Total: {referralInfo.stats.total} · Qualified: {referralInfo.stats.qualified} · Rewarded: {referralInfo.stats.rewarded}
                </div>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void loadReferralInfo();
              }}
              className="w-full rounded-md bg-gray-700 px-3 py-2 text-xs"
            >
              Refresh Referrals
            </button>
          </div>

          <div className="bg-dark-gray border border-gray-800 rounded-lg p-3 space-y-2">
            <div className="text-sm font-semibold">Ads</div>
            {adError ? <div className="text-xs text-red-400">{adError}</div> : null}
            {adLoading ? <div className="text-xs text-gray-400">Loading ad config...</div> : null}
            {!adLoading && adConfig ? (
              <>
                <div className="text-xs text-gray-300">Provider: {adConfig.provider}</div>
                <div className="text-xs text-gray-400">{adConfig.note}</div>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void handleWatchAd();
              }}
              disabled={!adConfig?.configured || watchingAd || pendingReward}
              className="w-full rounded-md bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {watchingAd ? 'Processing...' : 'Watch Ad for Reward'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-24">
        <Crown
          scale={tapEffect.isTapping ? 0.96 : 1}
          onTap={handleCrownTap}
          isAnimating={tapEffect.isTapping}
        />
        <Balance coins={playerState.coins} />
      </div>
    );
  };

  if (!playerState) {
    return <div className="w-full h-screen bg-matte-black" />;
  }

  return (
    <div className="w-full h-screen bg-matte-black flex flex-col overflow-hidden">
      {/* Particles layer */}
      <CoinParticles
        particles={tapEffect.particles}
        onAnimationFrame={updateParticles}
      />

      {/* Floating reward text */}
      {tapEffect.rewardPosition && (
        <TapReward
          x={tapEffect.rewardPosition.x}
          y={tapEffect.rewardPosition.y}
          opacity={tapEffect.rewardPosition.opacity}
        />
      )}

      {/* Header */}
      <Header level={playerState.level} balance={playerState.coins} />
      {gameError ? (
        <button
          type="button"
          onClick={clearGameError}
          className="mx-4 mb-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-left text-xs text-red-300"
        >
          {gameError}
        </button>
      ) : null}
      {renderTabContent()}

      {/* Bottom navigation */}
      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
};
