import { atom } from 'recoil';

const stored = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null;

export const darkModeState = atom<boolean>({
  key: 'darkModeState',
  default: stored === 'true',
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet((newValue) => {
        localStorage.setItem('darkMode', String(newValue));
      });
    },
  ],
});