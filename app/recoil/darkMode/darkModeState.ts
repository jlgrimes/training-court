import { atom } from 'recoil';

const stored = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null;

export const darkModeState = atom<boolean>({
  key: 'darkModeState',
  default: false,
  effects_UNSTABLE: [
    ({ setSelf, onSet }) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) {
          setSelf(stored === 'true');
        }
      }

      onSet((newValue) => {
        localStorage.setItem('darkMode', String(newValue));
      });
    },
  ],
});
