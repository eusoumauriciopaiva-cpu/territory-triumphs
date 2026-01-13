import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

interface TrackingState {
  isTracking: boolean;
  path: [number, number][];
  distance: number;
  duration: number;
  pace: number;
  canDominate: boolean;
}

interface BackgroundTrackingConfig {
  minDistanceForDominate: number; // meters
  distanceFilter: number; // meters between points
  onPositionUpdate?: (position: [number, number]) => void;
  onDominateReady?: () => void;
}

const DEFAULT_CONFIG: BackgroundTrackingConfig = {
  minDistanceForDominate: 500, // 500m to unlock "Dominar Área"
  distanceFilter: 5, // Record point every 5 meters
};

// Calculate distance between two coordinates in meters
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useBackgroundTracking(config: Partial<BackgroundTrackingConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    path: [],
    distance: 0,
    duration: 0,
    pace: 0,
    canDominate: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<[number, number] | null>(null);
  const wakeLockRef = useRef<any>(null);
  const notificationIdRef = useRef<number>(1);

  // Request wake lock to prevent screen/process suspension
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock acquired');
      }
    } catch (err) {
      console.log('Wake Lock not available:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  };

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }
    return false;
  };

  // Update persistent notification with current stats
  const updateNotification = useCallback(async (stats: TrackingState) => {
    if (!Capacitor.isNativePlatform()) return;

    const paceStr = stats.pace > 0 ? `${Math.floor(stats.pace)}'${Math.round((stats.pace % 1) * 60).toString().padStart(2, '0')}"` : '--';
    const timeStr = formatDuration(stats.duration);
    const distStr = (stats.distance / 1000).toFixed(2);

    const options: ScheduleOptions = {
      notifications: [{
        id: notificationIdRef.current,
        title: '🔥 ZONNA ATIVO',
        body: `Pace: ${paceStr}/km | ${distStr} km | ${timeStr}`,
        ongoing: true,
        autoCancel: false,
        smallIcon: 'ic_stat_zonna',
        iconColor: '#FF4F00',
        actionTypeId: stats.canDominate ? 'DOMINATE_ACTION' : undefined,
        extra: {
          canDominate: stats.canDominate,
        },
      }],
    };

    await LocalNotifications.schedule(options);
  }, []);

  // Cancel notification
  const cancelNotification = async () => {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({ notifications: [{ id: notificationIdRef.current }] });
    }
  };

  // Trigger haptic feedback and sound when dominate becomes available
  const triggerDominateAlert = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      // Vibration pattern
      await Haptics.notification({ type: NotificationType.Success });
      
      // Update notification with action button
      await updateNotification({ ...state, canDominate: true });
    }
  }, [state, updateNotification]);

  // Format duration to mm:ss or hh:mm:ss
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start tracking
  const startTracking = useCallback(async () => {
    await requestNotificationPermission();
    await requestWakeLock();

    // Register notification action types
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.registerActionTypes({
        types: [{
          id: 'DOMINATE_ACTION',
          actions: [{
            id: 'dominate',
            title: '🏆 DOMINAR ÁREA',
            foreground: true,
          }],
        }],
      });
    }

    // Reset state
    setState({
      isTracking: true,
      path: [],
      distance: 0,
      duration: 0,
      pace: 0,
      canDominate: false,
    });
    startTimeRef.current = Date.now();
    lastPositionRef.current = null;

    // Start timer
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 1;
        const distKm = prev.distance / 1000;
        const newPace = distKm > 0 ? newDuration / 60 / distKm : 0;
        
        const newState = {
          ...prev,
          duration: newDuration,
          pace: newPace,
        };

        // Update notification every 5 seconds
        if (newDuration % 5 === 0) {
          updateNotification(newState);
        }

        return newState;
      });
    }, 1000);

    // Start geolocation watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setState(prev => {
          // Apply distance filter - only record if moved enough
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current[0], lastPositionRef.current[1],
              newPos[0], newPos[1]
            );
            
            if (dist < fullConfig.distanceFilter) {
              return prev; // Skip this point
            }
          }

          lastPositionRef.current = newPos;
          
          const newPath = [...prev.path, newPos];
          
          // Calculate total distance
          let totalDist = prev.distance;
          if (prev.path.length > 0) {
            const lastPoint = prev.path[prev.path.length - 1];
            totalDist += calculateDistance(
              lastPoint[0], lastPoint[1],
              newPos[0], newPos[1]
            );
          }

          // Check if dominate is now available
          const newCanDominate = totalDist >= fullConfig.minDistanceForDominate;
          
          // Trigger alert when crossing threshold
          if (newCanDominate && !prev.canDominate) {
            triggerDominateAlert();
            config.onDominateReady?.();
          }

          config.onPositionUpdate?.(newPos);

          return {
            ...prev,
            path: newPath,
            distance: totalDist,
            canDominate: newCanDominate,
          };
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // Initial notification
    updateNotification({
      isTracking: true,
      path: [],
      distance: 0,
      duration: 0,
      pace: 0,
      canDominate: false,
    });
  }, [config, fullConfig, triggerDominateAlert, updateNotification]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    releaseWakeLock();
    await cancelNotification();

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Handle app state changes (resume tracking)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | null = null;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && state.isTracking && watchIdRef.current === null) {
        // App came back from background - resume tracking
        console.log('Resuming tracking after background');
        // Re-acquire wake lock
        requestWakeLock();
      }
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, [state.isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      releaseWakeLock();
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    formatDuration,
  };
}
