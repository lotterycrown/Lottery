import { PlayerProgress } from '../game/playerState';
import {
  DailyTaskState,
  REWARD_CONFIG,
  TASK_CONFIG,
  Task,
  TaskRewardType,
  TaskStatus,
  TaskType,
  TaskUnlockState,
} from '../game/taskConfig';
import { PersistedGameState } from '../utils/storageTypes';
import {
  addMoney,
  calculatePercentageReward,
  fromMicroUnits,
  toMicroUnits,
} from '../utils/money';

export interface TaskRepository {
  getTasks(): Task[];
  saveTasks(tasks: Task[]): void;
  getUnlockState(): TaskUnlockState;
  saveUnlockState(state: TaskUnlockState): void;
  getDailyState(): DailyTaskState;
  saveDailyState(state: DailyTaskState): void;
}

export interface PlayerRepository {
  getPlayer(): PlayerProgress;
  savePlayer(player: PlayerProgress): void;
}

export interface RewardRepository {
  addCoins(player: PlayerProgress, rewardCoins: number): PlayerProgress;
  addXp(player: PlayerProgress, xpReward: number): PlayerProgress;
}

type GetState = () => PersistedGameState;
type SetState = (updater: (state: PersistedGameState) => PersistedGameState) => void;

export class LocalTaskRepository implements TaskRepository {
  constructor(
    private readonly getState: GetState,
    private readonly setState: SetState
  ) {}

  getTasks(): Task[] {
    return this.getState().tasks;
  }

  saveTasks(tasks: Task[]): void {
    this.setState((state) => ({ ...state, tasks }));
  }

  getUnlockState(): TaskUnlockState {
    return this.getState().taskUnlockState;
  }

  saveUnlockState(taskUnlockState: TaskUnlockState): void {
    this.setState((state) => ({ ...state, taskUnlockState }));
  }

  getDailyState(): DailyTaskState {
    return this.getState().dailyTaskState;
  }

  saveDailyState(dailyTaskState: DailyTaskState): void {
    this.setState((state) => ({ ...state, dailyTaskState }));
  }
}

export class LocalPlayerRepository implements PlayerRepository {
  constructor(
    private readonly getState: GetState,
    private readonly setState: SetState
  ) {}

  getPlayer(): PlayerProgress {
    return this.getState().player;
  }

  savePlayer(player: PlayerProgress): void {
    this.setState((state) => ({ ...state, player }));
  }
}

export interface RewardCalculationInput {
  reward: number;
  rewardType: TaskRewardType;
}

export interface RewardCalculationOutput {
  amount: number;
  rewardType: TaskRewardType;
}

export interface ConfigurableRewardRepository extends RewardRepository {
  calculateReward(input: RewardCalculationInput): RewardCalculationOutput;
}

export class LocalRewardRepository implements ConfigurableRewardRepository {
  addCoins(player: PlayerProgress, rewardCoins: number): PlayerProgress {
    const totalMicroUnits = addMoney(player.coinsMicroUnits, toMicroUnits(rewardCoins));

    return {
      ...player,
      coinsMicroUnits: totalMicroUnits,
      coins: fromMicroUnits(totalMicroUnits),
    };
  }

  addXp(player: PlayerProgress, xpReward: number): PlayerProgress {
    return {
      ...player,
      xp: player.xp + xpReward,
    };
  }

  calculateReward(input: RewardCalculationInput): RewardCalculationOutput {
    if (!REWARD_CONFIG.percentageRewardEnabled || input.rewardType !== 'coins') {
      return {
        amount: input.reward,
        rewardType: input.rewardType,
      };
    }

    const percentageAmount = calculatePercentageReward(
      input.reward,
      REWARD_CONFIG.defaultPercentage
    );

    return {
      amount: percentageAmount,
      rewardType: input.rewardType,
    };
  }
}

export interface ClaimTaskResult {
  ok: boolean;
  rewardAmount: number;
  rewardType: TaskRewardType | null;
  message: string;
}

export class TaskManager {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly rewardRepository: ConfigurableRewardRepository
  ) {}

  getTasks(): Task[] {
    return this.taskRepository.getTasks();
  }

  getAvailableTasks(): Task[] {
    return this.getTasks().filter((task) => task.status === 'available');
  }

  getInProgressTasks(): Task[] {
    return this.getTasks().filter((task) => task.status === 'in_progress');
  }

  getCompletedTasks(): Task[] {
    return this.getTasks().filter((task) => task.status === 'completed');
  }

  getClaimedTasks(): Task[] {
    return this.getTasks().filter((task) => task.status === 'claimed');
  }

  markTasksPageOpened(): void {
    const unlockState = this.taskRepository.getUnlockState();
    if (!unlockState.hasUnreadUnlock) {
      return;
    }

    this.taskRepository.saveUnlockState({
      ...unlockState,
      hasUnreadUnlock: false,
    });
  }

  updateTaskProgress(taskType: TaskType, value: number): void {
    const tasks = this.taskRepository.getTasks();
    const nextTasks = tasks.map((task) => {
      if (task.type !== taskType || task.status === 'locked' || task.status === 'claimed') {
        return task;
      }

      const nextProgress = Math.min(task.target, value);
      const nextStatus = this.resolveStatus(task.status, nextProgress, task.target);

      return {
        ...task,
        progress: nextProgress,
        status: nextStatus,
      };
    });

    this.taskRepository.saveTasks(nextTasks);
  }

  registerValidTap(totalTaps: number): void {
    this.updateTaskProgress('tap', totalTaps);

    const unlockState = this.taskRepository.getUnlockState();
    let pendingTapCount = unlockState.pendingTapCount + 1;
    let lastUnlockedTaskId = unlockState.lastUnlockedTaskId;
    let hasUnreadUnlock = unlockState.hasUnreadUnlock;

    while (pendingTapCount >= TASK_CONFIG.tapsRequiredToUnlock) {
      pendingTapCount -= TASK_CONFIG.tapsRequiredToUnlock;
      const unlockedTaskId = this.unlockNextTask(totalTaps);
      if (!unlockedTaskId) {
        pendingTapCount = 0;
        break;
      }
      lastUnlockedTaskId = unlockedTaskId;
      hasUnreadUnlock = true;
    }

    this.taskRepository.saveUnlockState({
      pendingTapCount,
      lastUnlockedTaskId,
      hasUnreadUnlock,
    });
  }

  unlockNextTask(totalTaps: number): string | null {
    const tasks = this.taskRepository.getTasks();
    const activeCount = tasks.filter(
      (task) => task.status !== 'locked' && task.status !== 'claimed'
    ).length;

    if (activeCount >= TASK_CONFIG.maxActiveTasks) {
      return null;
    }

    const taskIndex = tasks.findIndex((task) => task.status === 'locked');
    if (taskIndex === -1) {
      return null;
    }

    const targetTask = tasks[taskIndex];
    const progress = Math.min(targetTask.target, totalTaps);
    const nextStatus = this.resolveStatus('available', progress, targetTask.target);

    const unlockedTask: Task = {
      ...targetTask,
      progress,
      status: nextStatus,
      createdAt: Date.now(),
    };

    const nextTasks = [...tasks];
    nextTasks[taskIndex] = unlockedTask;
    this.taskRepository.saveTasks(nextTasks);

    return unlockedTask.id;
  }

  completeTask(taskId: string): void {
    const tasks = this.taskRepository.getTasks().map((task) => {
      if (task.id !== taskId || task.status === 'claimed' || task.status === 'locked') {
        return task;
      }

      return {
        ...task,
        progress: task.target,
        status: 'completed' as TaskStatus,
      };
    });

    this.taskRepository.saveTasks(tasks);
  }

  claimTaskReward(taskId: string): ClaimTaskResult {
    const tasks = this.taskRepository.getTasks();
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return {
        ok: false,
        rewardAmount: 0,
        rewardType: null,
        message: 'Task not found.',
      };
    }

    const task = tasks[taskIndex];
    if (task.status !== 'completed') {
      return {
        ok: false,
        rewardAmount: 0,
        rewardType: null,
        message: 'Task is not claimable.',
      };
    }

    const reward = this.rewardRepository.calculateReward({
      reward: task.reward,
      rewardType: task.rewardType,
    });

    const player = this.playerRepository.getPlayer();
    const nextPlayer =
      reward.rewardType === 'coins'
        ? this.rewardRepository.addCoins(player, reward.amount)
        : this.rewardRepository.addXp(player, reward.amount || REWARD_CONFIG.defaultXpReward);

    this.playerRepository.savePlayer(nextPlayer);

    const nextTasks = [...tasks];
    nextTasks[taskIndex] = {
      ...task,
      status: 'claimed',
    };
    this.taskRepository.saveTasks(nextTasks);

    return {
      ok: true,
      rewardAmount: reward.amount,
      rewardType: reward.rewardType,
      message: 'Reward claimed successfully.',
    };
  }

  private resolveStatus(
    currentStatus: TaskStatus,
    progress: number,
    target: number
  ): TaskStatus {
    if (currentStatus === 'claimed') {
      return 'claimed';
    }

    if (progress >= target) {
      return 'completed';
    }

    if (progress > 0) {
      return 'in_progress';
    }

    return 'available';
  }
}
