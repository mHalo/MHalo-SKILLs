"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

export function useAutoRefresh({ onRefresh, enabled = true }: UseAutoRefreshOptions) {
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  // 使用 ref 存储 onRefresh，避免依赖变化导致重新渲染
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return AUTO_REFRESH_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      // Dismiss any existing countdown toast
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
      // Show refreshing toast
      toastIdRef.current = toast.loading("正在刷新数据...", {
        duration: Infinity,
      });

      await onRefreshRef.current();

      // Dismiss the refreshing toast and show success with countdown
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = toast.success(`数据已刷新，下次刷新在 ${AUTO_REFRESH_INTERVAL / 1000}秒 后`, {
        duration: 3000,
      });

      // Reset countdown
      startCountdown();
    } catch (error) {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
      toast.error("数据刷新失败");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, startCountdown]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Start the countdown
    startCountdown();

    // Set up the auto-refresh interval
    timerRef.current = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearTimers();
    };
  }, [enabled, clearTimers, handleRefresh, startCountdown]);

  return {
    countdown,
    isRefreshing,
    triggerRefresh: handleRefresh,
  };
}
