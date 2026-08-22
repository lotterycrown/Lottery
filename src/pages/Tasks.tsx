import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task } from '../game/taskConfig';

interface TasksPageProps {
  availableTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  claimedTasks: Task[];
  onClaimReward: (taskId: string) => {
    ok: boolean;
    rewardAmount: number;
    rewardType: 'coins' | 'xp' | null;
    message: string;
  };
}

const iconPathByName: Record<string, string> = {
  spark: 'M11 2l2.2 4.8L18 9l-4.8 2.2L11 16l-2.2-4.8L4 9l4.8-2.2L11 2z',
  crown: 'M3 16l1.6-9 4.4 4 4-6 4 6 4.4-4L23 16H3z',
  shield: 'M13 2l8 3v6c0 5-3.3 9.5-8 11-4.7-1.5-8-6-8-11V5l8-3z',
};

const TaskIcon: React.FC<{ icon: string }> = ({ icon }) => (
  <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-bronze-500/30 flex items-center justify-center">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-bronze-400">
      <path d={iconPathByName[icon] ?? iconPathByName.spark} stroke="currentColor" strokeWidth="1.75" />
    </svg>
  </div>
);

const ProgressBar: React.FC<{ progress: number; target: number }> = ({ progress, target }) => {
  const percentage = Math.max(0, Math.min(100, (progress / target) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-bronze-600 to-bronze-400"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
};

const TaskCard: React.FC<{
  task: Task;
  onClaimReward: (taskId: string) => {
    ok: boolean;
    rewardAmount: number;
    rewardType: 'coins' | 'xp' | null;
    message: string;
  };
  onClaimed: (text: string) => void;
}> = ({ task, onClaimReward, onClaimed }) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const buttonLabel =
    task.status === 'completed'
      ? 'CLAIM REWARD'
      : task.status === 'claimed'
      ? 'CLAIMED'
      : task.status === 'in_progress'
      ? 'IN PROGRESS'
      : 'AVAILABLE';

  const isClaimable = task.status === 'completed' && !isClaiming;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-dark-gray border border-zinc-800 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start gap-3">
        <TaskIcon icon={task.icon} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-white font-semibold tracking-wide">{task.title}</h3>
          <p className="text-xs text-zinc-400 mt-1">{task.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-[11px] tracking-[0.12em] text-zinc-400">PROGRESS</div>
        <div className="text-xs text-zinc-100">
          {task.progress} / {task.target}
        </div>
        <ProgressBar progress={task.progress} target={task.target} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.12em] text-zinc-400">REWARD</div>
          <div className="text-sm text-bronze-400 font-semibold">
            +{task.reward.toFixed(3)} {task.rewardType === 'coins' ? 'CROWN' : 'XP'}
          </div>
        </div>
        <motion.button
          whileTap={isClaimable ? { scale: 0.94 } : {}}
          disabled={!isClaimable}
          className={`px-4 py-2 rounded-lg text-[11px] tracking-[0.12em] font-semibold border transition-colors ${
            isClaimable
              ? 'border-bronze-500/60 text-bronze-300 bg-bronze-600/10'
              : 'border-zinc-700 text-zinc-500 bg-zinc-900'
          }`}
          onClick={() => {
            setIsClaiming(true);
            const result = onClaimReward(task.id);
            setIsClaiming(false);
            if (result.ok) {
              onClaimed(
                `+${result.rewardAmount.toFixed(3)} ${
                  result.rewardType === 'coins' ? 'CROWN' : 'XP'
                }`
              );
            }
          }}
        >
          {buttonLabel}
        </motion.button>
      </div>
    </motion.article>
  );
};

export const Tasks: React.FC<TasksPageProps> = ({
  availableTasks,
  inProgressTasks,
  completedTasks,
  claimedTasks,
  onClaimReward,
}) => {
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const completedSectionTasks = useMemo(
    () => [...completedTasks, ...claimedTasks],
    [completedTasks, claimedTasks]
  );

  return (
    <div className="w-full h-screen bg-matte-black text-white overflow-y-auto pb-28">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-sm tracking-[0.2em] font-semibold">TASKS</h1>
        <p className="text-xs text-zinc-400 mt-1">Complete activities to earn more.</p>
      </header>

      <AnimatePresence>
        {claimMessage && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="mx-4 mb-2 rounded-xl border border-bronze-500/40 bg-dark-gray px-4 py-3 text-xs text-bronze-300"
            onAnimationComplete={() => {
              const timer = setTimeout(() => setClaimMessage(null), 1200);
              return () => clearTimeout(timer);
            }}
          >
            {claimMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="px-4 mt-3">
        <h2 className="text-[11px] text-zinc-400 tracking-[0.18em] mb-3">AVAILABLE</h2>
        <div className="space-y-3">
          {availableTasks.length === 0 ? (
            <div className="text-xs text-zinc-500 rounded-xl border border-zinc-800 p-4">No available tasks.</div>
          ) : (
            availableTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaimReward={onClaimReward}
                onClaimed={setClaimMessage}
              />
            ))
          )}
        </div>
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-[11px] text-zinc-400 tracking-[0.18em] mb-3">IN PROGRESS</h2>
        <div className="space-y-3">
          {inProgressTasks.length === 0 ? (
            <div className="text-xs text-zinc-500 rounded-xl border border-zinc-800 p-4">No tasks in progress.</div>
          ) : (
            inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaimReward={onClaimReward}
                onClaimed={setClaimMessage}
              />
            ))
          )}
        </div>
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-[11px] text-zinc-400 tracking-[0.18em] mb-3">COMPLETED</h2>
        <div className="space-y-3">
          {completedSectionTasks.length === 0 ? (
            <div className="text-xs text-zinc-500 rounded-xl border border-zinc-800 p-4">No completed tasks yet.</div>
          ) : (
            completedSectionTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaimReward={onClaimReward}
                onClaimed={setClaimMessage}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
