export const lightTheme = {
  paper: '#faf7f2',
  paper2: '#f3ede2',
  ink: '#1a1814',
  inkSoft: '#4a4640',
  inkFaint: '#9a948a',
  line: '#2a2620',
  accentOrange: '#e85d3c',
  accentBlue: '#3a6ea5',
  accentYellow: '#f5d547',
  accentMint: '#8fbc94',
  shade: 'rgba(26, 24, 20, 0.06)',
  shade2: 'rgba(26, 24, 20, 0.12)',
  onYellow: '#1a1814',
};

export const darkTheme: typeof lightTheme = {
  paper: '#1c1a17',
  paper2: '#25221e',
  ink: '#f0ebe0',
  inkSoft: '#b8b1a4',
  inkFaint: '#6a6660',
  line: '#d4cdbf',
  accentOrange: '#e85d3c',
  accentBlue: '#3a6ea5',
  accentYellow: '#f5d547',
  accentMint: '#8fbc94',
  shade: 'rgba(240, 235, 224, 0.08)',
  shade2: 'rgba(240, 235, 224, 0.14)',
  onYellow: '#1a1814',
};

export type Theme = typeof lightTheme;

export const fonts = {
  caveat: 'Caveat',
  caveatBold: 'Caveat-Bold',
  nunito: 'Nunito',
  nunitoBold: 'Nunito-Bold',
  mono: 'JetBrainsMono',
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
};

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';
type Ctx = { theme: Theme; mode: ThemeMode; setMode: (m: ThemeMode) => void };

const ThemeCtx = createContext<Ctx>({ theme: lightTheme, mode: 'light', setMode: () => {} });

export function ThemeProvider({ children, initialMode = 'light' }: { children: ReactNode; initialMode?: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const value = useMemo(() => ({
    theme: mode === 'dark' ? darkTheme : lightTheme,
    mode,
    setMode,
  }), [mode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
