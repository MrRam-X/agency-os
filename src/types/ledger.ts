export interface IDailyLogGroup {
  _id: string; // YYYY-MM-DD
  tasks: {
    id: string;
    title: string;
    type: "BUG" | "TASK" | "CHANGE_REQUEST";
    estimatedHours: number;
    projectName: string; // 🟢 Added!
  }[];
  totalEstimatedHours: number;
}

export interface IAuditLedgerEntry {
  _id: string;
  orgId: string;
  userId: string;
  taskId: string;
  storyId: string;
  hoursLogged: number;
  billingStatus: "UNBILLED" | "BILLED";
  date: string;
  devName: string;
  taskTitle: string;
  taskType: "BUG" | "TASK" | "CHANGE_REQUEST";
}