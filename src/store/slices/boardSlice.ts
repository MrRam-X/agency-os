import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Strictly typed Task interface matching our serialized model
export interface BoardTask {
  _id: string;
  orgId: string;
  sprintId: string;
  storyId: string;
  assignedTo: string;
  title: string;
  description?: string;
  status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  estimatedHours: number;
  createdBy: string;
  completionDate?: string | null;
  type: TaskType
}

export type TaskType = "BUG" | "TASK" | "CHANGE_REQUEST"

interface BoardState {
  originalTasks: BoardTask[]; // Read-only snapshot of database state
  currentTasks: BoardTask[]; // Local interactive state (dragged & updated locally)
  isDirty: boolean; // True if currentTasks status differs from originalTasks
}

const initialState: BoardState = {
  originalTasks: [],
  currentTasks: [],
  isDirty: false,
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    // 1. Hydrate the board with fresh data from the server
    initializeBoard: (state, action: PayloadAction<BoardTask[]>) => {
      state.originalTasks = action.payload;
      state.currentTasks = action.payload;
      state.isDirty = false;
    },

    // 2. Locally update a task's status during drag-and-drop (Zero network requests)
    updateTaskStatusLocal: (
      state,
      action: PayloadAction<{ taskId: string; newStatus: BoardTask["status"] }>,
    ) => {
      const { taskId, newStatus } = action.payload;

      // Update status in the active currentTasks array
      state.currentTasks = state.currentTasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task,
      );

      // 🛡️ High-Performance Diffing Algorithm:
      // Compare only the 'status' property between current and original arrays to evaluate changes
      const hasChanges = state.currentTasks.some((task) => {
        const original = state.originalTasks.find((o) => o._id === task._id);
        return original ? original.status !== task.status : false;
      });

      state.isDirty = hasChanges;
    },

    // 3. Discard client changes: Revert the active board back to the original database snapshot
    discardBoardChanges: (state) => {
      state.currentTasks = state.originalTasks;
      state.isDirty = false;
    },

    // 4. Commit successful changes: Update originalTasks to match currentTasks after a successful database write
    commitBoardChangesSuccess: (state) => {
      state.originalTasks = state.currentTasks;
      state.isDirty = false;
    },

    // 5. Append a newly created sub-task to both arrays immediately
    addNewTaskLocal: (state, action: PayloadAction<BoardTask>) => {
      state.originalTasks = [...state.originalTasks, action.payload];
      state.currentTasks = [...state.currentTasks, action.payload];
    },
  },
});

export const {
  initializeBoard,
  updateTaskStatusLocal,
  discardBoardChanges,
  commitBoardChangesSuccess,
  addNewTaskLocal,
} = boardSlice.actions;

export default boardSlice.reducer;
