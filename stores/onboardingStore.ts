import { create } from 'zustand';

type OnboardingState = {
  firstName: string;
  nickname: string;
  selectedInterestIds: string[];
  cityId: string;
  joinedGromadaIds: string[];
  notificationsEnabled: boolean;
  rulesAccepted: boolean;

  setFirstName: (name: string) => void;
  setNickname: (nickname: string) => void;
  toggleInterest: (id: string) => void;
  setCityId: (id: string) => void;
  toggleGromada: (id: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setRulesAccepted: (accepted: boolean) => void;
  reset: () => void;
};

const initialState = {
  firstName: '',
  nickname: '',
  selectedInterestIds: [] as string[],
  cityId: '',
  joinedGromadaIds: [] as string[],
  notificationsEnabled: false,
  rulesAccepted: false,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setFirstName: (firstName) => set({ firstName }),
  setNickname: (nickname) => set({ nickname }),

  toggleInterest: (id) => {
    const current = get().selectedInterestIds;
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    set({ selectedInterestIds: next });
  },

  setCityId: (cityId) => set({ cityId }),

  toggleGromada: (id) => {
    const current = get().joinedGromadaIds;
    const next = current.includes(id)
      ? current.filter((g) => g !== id)
      : [...current, id];
    set({ joinedGromadaIds: next });
  },

  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setRulesAccepted: (rulesAccepted) => set({ rulesAccepted }),
  reset: () => set(initialState),
}));
