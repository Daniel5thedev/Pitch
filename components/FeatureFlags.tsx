"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type FlagValue = boolean | string | number | null | undefined;
type FlagMap = Record<string, FlagValue>;

interface FeatureFlagContextValue {
  flags: FlagMap;
  ready: boolean;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  ready: true,
  isEnabled: () => false
});

function coerceFlag(value: FlagValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return ["1", "true", "enabled", "on", "yes"].includes(value.toLowerCase());
  return false;
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags] = useState<FlagMap>({});
  const ready = true;

  const isEnabled = useCallback((key: string) => coerceFlag(flags[key]), [flags]);
  const value = useMemo(() => ({ flags, ready, isEnabled }), [flags, ready, isEnabled]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
