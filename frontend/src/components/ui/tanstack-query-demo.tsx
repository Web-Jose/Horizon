"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowsClockwiseIcon,
  LightningIcon,
  DatabaseIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";

interface TanStackQueryDemoProps {
  workspaceId: string;
}

export function TanStackQueryDemo({ workspaceId }: TanStackQueryDemoProps) {
  const queryClient = useQueryClient();

  const handleRefreshAll = () => {
    queryClient.invalidateQueries();
  };

  const handlePreloadData = () => {
    // Example of prefetching data
    queryClient.prefetchQuery({
      queryKey: ["items", workspaceId],
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const getCacheStats = () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    const stats = {
      total: queries.length,
      fresh: queries.filter((q) => q.isStale() === false).length,
      stale: queries.filter((q) => q.isStale() === true).length,
      loading: queries.filter((q) => q.state.fetchStatus === "fetching").length,
    };

    return stats;
  };

  const stats = getCacheStats();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LightningIcon className="w-5 h-5 text-yellow-500" />
          TanStack Query Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="bg-blue-50 rounded p-2 text-center">
            <div className="font-bold text-blue-900">{stats.total}</div>
            <div className="text-blue-700">Total Queries</div>
          </div>
          <div className="bg-green-50 rounded p-2 text-center">
            <div className="font-bold text-green-900">{stats.fresh}</div>
            <div className="text-green-700">Fresh Data</div>
          </div>
          <div className="bg-orange-50 rounded p-2 text-center">
            <div className="font-bold text-orange-900">{stats.stale}</div>
            <div className="text-orange-700">Stale Data</div>
          </div>
          <div className="bg-purple-50 rounded p-2 text-center">
            <div className="font-bold text-purple-900">{stats.loading}</div>
            <div className="text-purple-700">Loading</div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <DatabaseIcon className="w-4 h-4" />
            <span>Automatic caching with smart invalidation</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <WifiHighIcon className="w-4 h-4" />
            <span>Background updates keep data fresh</span>
          </div>
          <div className="flex items-center gap-2 text-purple-700">
            <LightningIcon className="w-4 h-4" />
            <span>Optimistic updates for instant UI feedback</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowsClockwiseIcon className="w-4 h-4" />
            Refresh All
          </Button>
          <Button
            onClick={handlePreloadData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <DatabaseIcon className="w-4 h-4" />
            Preload Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
