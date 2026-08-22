export type TaskType = 'tap' | 'level' | 'daily' | 'special';
export type TaskStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'claimed';

export type TaskRewardType = 'coins' | 'xp';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  target: number;
  progress: number;
  reward: number;
  rewardType: TaskRewardType;
  status: TaskStatus;
  icon: string;
  createdAt?: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

export interface DailyTaskState {
  dailyTaskId: string | null;
  resetAt: number | null;
  completedAt: number | null;
  rewardClaimedAt: number | null;
}

export interface TaskUnlockState {
  pendingTapCount: number;
  hasUnreadUnlock: boolean;
  lastUnlockedTaskId: string | null;
}

export const TASK_CONFIG = {
  tapsRequiredToUnlock: 5,
  maxActiveTasks: 3,
  enableDailyTasks: true,
} as const;

export const REWARD_CONFIG = {
  defaultTaskReward: 0.05,
  defaultXpReward: 25,
  percentageRewardEnabled: true,
  defaultPercentage: 1,
} as const;

const now = Date.now();

export const INITIAL_TASK_DEFINITIONS: Omit<Task, 'progress' | 'status'>[] = [
  {
    id: 'tap_25',
    title: 'First Steps',
    description: 'Tap the crown 25 times.',
    type: 'tap',
    target: 25,
    reward: REWARD_CONFIG.defaultTaskReward,
    rewardType: 'coins',
    icon: 'spark',
    createdAt: now,
    metadata: { tier: 1 },
  },
  {
    id: 'tap_100',
    title: 'Getting Started',
    description: 'Tap the crown 100 times.',
    type: 'tap',
    target: 100,
    reward: 0.15,
    rewardType: 'coins',
    icon: 'crown',
    createdAt: now,
    metadata: { tier: 2 },
  },
  {
    id: 'tap_500',
    title: 'Dedicated',
    description: 'Tap the crown 500 times.',
    type: 'tap',
    target: 500,
    reward: 1,
    rewardType: 'coins',
    icon: 'shield',
    createdAt: now,
    metadata: { tier: 3 },
  },
];

export const createInitialTasks = (): Task[] =>
  INITIAL_TASK_DEFINITIONS.map((task, index) => ({
    ...task,
    progress: 0,
    status: index === 0 ? 'available' : 'locked',
  }));

export const createInitialTaskUnlockState = (): TaskUnlockState => ({
  pendingTapCount: 0,
  hasUnreadUnlock: false,
  lastUnlockedTaskId: null,
});

export const createInitialDailyTaskState = (): DailyTaskState => ({
  dailyTaskId: null,
  resetAt: null,
  completedAt: null,
  rewardClaimedAt: null,
});
