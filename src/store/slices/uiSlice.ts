import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  activeProjectId: string | null;
  activeSprintId: string | null;
  sidebarOpen: boolean;
}

const initialState: UiState = {
  activeProjectId: null,
  activeSprintId: null,
  sidebarOpen: true, // Desktop-first layout defaults to open
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveProject: (state, action: PayloadAction<string | null>) => {
      state.activeProjectId = action.payload;
    },
    setActiveSprint: (state, action: PayloadAction<string | null>) => {
      state.activeSprintId = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setActiveProject, setActiveSprint, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;