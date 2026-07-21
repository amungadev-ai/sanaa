'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-notifications';
import { toast } from 'sonner';

const STORAGE_KEY = 'push-notification-permission';

type PermissionState = 'default' | 'granted' | 'denied';

export function PushNotificationPrompt() {
  const [permissionState, setPermissionState] = useState<PermissionState>('default');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check browser support
    const pushSupported = isPushSupported();
    setSupported(pushSupported);

    if (!pushSupported) return;

    // Check localStorage first, then actual browser permission
    const stored = localStorage.getItem(STORAGE_KEY) as PermissionState | null;
    const browserPermission = Notification.permission as PermissionState;

    // Sync state with actual browser permission
    const effective = browserPermission || stored || 'default';
    setPermissionState(effective);

    // Keep localStorage in sync with browser state
    if (browserPermission !== stored) {
      localStorage.setItem(STORAGE_KEY, browserPermission);
    }
  }, []);

  const handleEnable = async () => {
    if (!isPushSupported()) return;

    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPermissionState(permission);
      localStorage.setItem(STORAGE_KEY, permission);

      if (permission === 'granted') {
        // Create push subscription
        const subscription = await subscribeToPush();
        if (subscription) {
          // Send subscription to server for storage
          try {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription.toJSON()),
            });
          } catch {
            // Server endpoint may not exist yet — subscription is still valid locally
            console.log('[Push] Could not send subscription to server');
          }
          toast.success('Push notifications enabled');
        }
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
      }
    } catch (error) {
      console.error('[Push] Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setPermissionState('default');
      localStorage.setItem(STORAGE_KEY, 'default');

      // Notify server to remove subscription
      try {
        await fetch('/api/push/unsubscribe', { method: 'POST' });
      } catch {
        // Server endpoint may not exist yet
      }

      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('[Push] Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if push is not supported
  if (!supported) return null;

  // Already granted — show an active bell with option to disable
  if (permissionState === 'granted') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-emerald-600 dark:text-emerald-400"
            onClick={handleDisable}
            disabled={loading}
            aria-label="Push notifications enabled — click to disable"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Push notifications enabled</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Denied — show a disabled bell with tooltip
  if (permissionState === 'denied') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            disabled
            aria-label="Notifications blocked"
          >
            <BellOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Enable in browser settings</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default — show prompt button
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleEnable}
          disabled={loading}
          aria-label="Enable push notifications"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Enable push notifications</p>
      </TooltipContent>
    </Tooltip>
  );
}
