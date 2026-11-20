import { createContext, useContext } from 'react';

export const PreviewThemeContext = createContext({ active: false, draft: null });

export function usePreviewTheme() {
  return useContext(PreviewThemeContext);
}
