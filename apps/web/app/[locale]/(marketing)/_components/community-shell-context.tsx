'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { TrendingHashtag } from '@kit/community/hashtags';

import type { CategoryLeaderboardItem } from './community-right-rail';

export type CommunityRightRailData = {
  trendingHashtags: TrendingHashtag[];
  categoryLeaderboard: CategoryLeaderboardItem[];
  totalDuas: number;
  totalAmeens: number;
  categoryCount: number;
  channelCount: number;
};

type CommunityShellContextValue = {
  rightRail: CommunityRightRailData | null;
  setRightRail: (value: CommunityRightRailData | null) => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
};

const CommunityShellContext = createContext<CommunityShellContextValue | null>(
  null,
);

export function CommunityShellProvider({ children }: { children: ReactNode }) {
  const [rightRail, setRightRail] = useState<CommunityRightRailData | null>(
    null,
  );
  const [composeOpen, setComposeOpen] = useState(false);

  const value = useMemo(
    () => ({
      rightRail,
      setRightRail,
      composeOpen,
      setComposeOpen,
    }),
    [rightRail, composeOpen],
  );

  return (
    <CommunityShellContext.Provider value={value}>
      {children}
    </CommunityShellContext.Provider>
  );
}

export function useCommunityRightRail() {
  const context = useContext(CommunityShellContext);

  if (!context) {
    throw new Error(
      'useCommunityRightRail must be used within CommunityShellProvider',
    );
  }

  return context;
}

export function CommunityRightRailPortal({
  data,
}: {
  data: CommunityRightRailData;
}) {
  const { setRightRail } = useCommunityRightRail();
  const payload = JSON.stringify(data);

  useEffect(() => {
    setRightRail(JSON.parse(payload) as CommunityRightRailData);

    return () => setRightRail(null);
  }, [payload, setRightRail]);

  return null;
}
