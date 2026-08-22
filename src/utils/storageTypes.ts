import { PlayerProgress } from '../game/playerState';
import { DailyTaskState, Task, TaskUnlockState } from '../game/taskConfig';

export interface PersistedGameState {
  player: PlayerProgress;
  tasks: Task[];
  taskUnlockState: TaskUnlockState;
  dailyTaskState: DailyTaskState;
}
