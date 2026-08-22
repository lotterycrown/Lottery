import React, { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { NavItem } from '../components/BottomNavigation';
import { buildReferralLink } from '../referrals/link';
import {
  getLocalUserId,
  getOrCreateReferralCode,
  getReferralStats,
  getReferralsByReferrer,
} from '../referrals/localReferralStore';
import { Referral, ReferralStats } from '../referrals/types';

interface ReferralsProps {
  onNavigate: (tab: NavItem) => void;
}

const formatCoins = (microAmount: number): string => (microAmount / 1_000_000).toFixed(2);

export const Referrals: React.FC<ReferralsProps> = ({ onNavigate }) => {
  const userId = useMemo(() => getLocalUserId(), []);
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({
    totalInvites: 0,
    pending: 0,
    qualified: 0,
    rewarded: 0,
    rewardsEarned: 0,
  });
  const [history, setHistory] = useState<Referral[]>([]);

  useEffect(() => {
    const load = async () => {
      const referralCode = await getOrCreateReferralCode(userId);
      setCode(referralCode.code);
      setStats(getReferralStats(userId));
      setHistory(getReferralsByReferrer(userId));
    };

    load();
  }, [userId]);

  const link = code ? buildReferralLink(code) : '';

  const copyLink = async (): Promise<void> => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
  };

  const shareLink = async (): Promise<void> => {
    if (!link) return;

    if (navigator.share) {
      await navigator.share({
        title: 'Crown Invite',
        text: 'Join Crown and play with me',
        url: link,
      });
      return;
    }

    await copyLink();
  };

  return (
    <div className="w-full h-screen bg-matte-black text-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-4">
        <section className="bg-dark-gray rounded-2xl border border-gray-800 p-4 space-y-3">
          <h1 className="text-lg font-bold tracking-wide">INVITE FRIENDS</h1>
          <p className="text-sm text-gray-300">Invite friends and earn rewards.</p>
          <p className="text-bronze-400 font-semibold">{code || 'Generating...'}</p>
          <p className="text-xs text-gray-400 break-all">{link}</p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-lg bg-bronze-500 text-black font-semibold py-2"
              type="button"
              onClick={() => {
                void copyLink();
              }}
            >
              COPY LINK
            </button>
            <button
              className="flex-1 rounded-lg border border-bronze-500 text-bronze-300 font-semibold py-2"
              type="button"
              onClick={() => {
                void shareLink();
              }}
            >
              SHARE
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="bg-dark-gray rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Total Invites</p>
            <p className="text-xl font-semibold">{stats.totalInvites}</p>
          </div>
          <div className="bg-dark-gray rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-semibold">{stats.pending}</p>
          </div>
          <div className="bg-dark-gray rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Qualified</p>
            <p className="text-xl font-semibold">{stats.qualified}</p>
          </div>
          <div className="bg-dark-gray rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Rewards Earned</p>
            <p className="text-xl font-semibold">+{formatCoins(stats.rewardsEarned)} CROWN</p>
          </div>
        </section>

        <section className="bg-dark-gray rounded-2xl border border-gray-800 p-4 space-y-2">
          <h2 className="text-base font-bold tracking-wide">REFERRAL LIST</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No referrals yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.referredUserId.slice(-6)}</span>
                  <span>{item.status}</span>
                  <span className="text-gray-400">{item.createdAt.toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <BottomNavigation activeTab="referrals" onChange={onNavigate} />
    </div>
  );
};
