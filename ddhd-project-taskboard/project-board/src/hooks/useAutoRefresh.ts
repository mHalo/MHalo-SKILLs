"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

export function useAutoRefresh({ onRefresh, enabled = true }: UseAutoRefreshOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const isRefreshingRef = useRef(false);
  // 使用 ref 存储 onRefresh，避免依赖变化导致重新渲染
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      // Dismiss any existing countdown toast
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
      // Show refreshing toast
      toastIdRef.current = toast.loading("正在刷新数据...", {
        duration: Infinity,
      });

      await onRefreshRef.current();

      // Dismiss the refreshing toast and show success
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = toast.success(`数据已刷新，下次刷新在 ${AUTO_REFRESH_INTERVAL / 1000}秒 后`, {
        duration: 3000,
      });
    } catch (error) {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
      toast.error("数据刷新失败");
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Set up the auto-refresh interval
    timerRef.current = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearTimers();
    };
  }, [enabled, clearTimers, handleRefresh]);

  return {
    triggerRefresh: handleRefresh,
  };
}
