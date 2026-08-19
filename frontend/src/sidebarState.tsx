import { createContext, useContext } from 'react';

export const SidebarStateContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

export function useSidebarState() {
  return useContext(SidebarStateContext);
}
