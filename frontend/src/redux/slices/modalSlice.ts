import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState }                  from "@/redux/store";
import type { ModalName }                  from "@/types/ui";

interface ModalEntry {
  open:    boolean;
  payload: Record<string, unknown>;
}

type ModalStateMap = Record<ModalName, ModalEntry>;

const CLOSED: ModalEntry = { open: false, payload: {} };

const initialState: ModalStateMap = {
  createProperty:   CLOSED,
  createRoomType:   CLOSED,
  seedCalendar:     CLOSED,
  blockDates:       CLOSED,
  cancelBooking:    CLOSED,
  assignRole:       CLOSED,
  grantPermission:  CLOSED,
  confirmAction:    CLOSED,
};

const modalSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ name: ModalName; payload?: Record<string, unknown> }>
    ) => {
      state[action.payload.name] = {
        open:    true,
        payload: action.payload.payload ?? {},
      };
    },

    closeModal: (state, action: PayloadAction<ModalName>) => {
      state[action.payload] = CLOSED;
    },

    closeAllModals: (state) => {
      (Object.keys(state) as ModalName[]).forEach((key) => {
        state[key] = CLOSED;
      });
    },
  },
});

export const { openModal, closeModal, closeAllModals } = modalSlice.actions;

export default modalSlice.reducer;

// Selectors
export const selectModal = (name: ModalName) => (s: RootState) => s.modals[name];
export const selectModalOpen = (name: ModalName) => (s: RootState) => s.modals[name].open;
export const selectModalPayload = (name: ModalName) => (s: RootState) => s.modals[name].payload;