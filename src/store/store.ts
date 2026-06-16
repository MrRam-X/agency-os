import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import boardReducer from "./slices/boardSlice"; // 🟢 Imported

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    board: boardReducer, // 🟢 Registered
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
