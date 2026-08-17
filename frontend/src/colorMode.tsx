import { createContext, useContext } from 'react';

export const ColorModeContext = createContext<{ mode: 'light' | 'dark'; toggle: () => void }>({
  mode: 'light',
  toggle: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
