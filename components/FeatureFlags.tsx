"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FlagValue = boolean | string | number | null | undefined;
type FlagMap = Record<string, FlagValue>;

interface FeatureFlagContextValue {
  flags: FlagMap;
  ready: boolean;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  ready: false,
  isEnabled: () => false
});

function coerceFlag(value: FlagValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return ["1", "true", "enabled", "on", "yes"].includes(value.toLowerCase());
  return false;
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlagMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function loadFlags() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const appMetadata = data.session?.user.app_metadata ?? {};
      const jwtFlags = typeof appMetadata.feature_flags === "object" && appMetadata.feature_flags !== null
        ? appMetadata.feature_flags as FlagMap
        : {};
      setFlags(jwtFlags);
      setReady(true);
    }

    void loadFlags();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const appMetadata = session?.user.app_metadata ?? {};
      const jwtFlags = typeof appMetadata.feature_flags === "object" && appMetadata.feature_flags !== null
        ? appMetadata.feature_flags as FlagMap
        : {};
      setFlags(jwtFlags);
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isEnabled = useCallback((key: string) => coerceFlag(flags[key]), [flags]);

  const value = useMemo(() => ({ flags, ready, isEnabled }), [flags, ready, isEnabled]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
