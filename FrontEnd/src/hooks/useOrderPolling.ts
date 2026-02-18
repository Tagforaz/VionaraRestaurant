import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

const statusLabels: Record<number, string> = {
  1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır',
  4: 'Hazırdır', 5: 'Yoldadır', 6: 'Çatdırılıb',
  7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
};

const statusEmojis: Record<number, string> = {
  1: '⏳', 2: '✅', 3: '👨‍🍳', 4: '🍽️',
  5: '🚴', 6: '📦', 7: '🎉', 8: '❌', 9: '⚠️',
};

interface PollingOrder {
  id: string;
  orderNumber: string;
  status: number;
}

interface UseOrderPollingOptions {
  fetchFn: () => Promise<PollingOrder[] | null>;
  watchStatuses?: number[];
  intervalMs?: number;
}

export const useOrderPolling = ({
  fetchFn,
  watchStatuses,
  intervalMs = 15000,
}: UseOrderPollingOptions) => {
  const prevOrdersRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );
    audioRef.current.volume = 0.5;
  }, []);

  const check = useCallback(async () => {
    const freshOrders = await fetchFn();
    if (!freshOrders) return;

    if (isFirstFetchRef.current) {
      freshOrders.forEach(o => prevOrdersRef.current.set(o.id, o.status));
      isFirstFetchRef.current = false;
      return;
    }

    let hasNotification = false;

    freshOrders.forEach(order => {
      const prevStatus = prevOrdersRef.current.get(order.id);

      if (prevStatus === undefined) {
        if (!watchStatuses || watchStatuses.includes(order.status)) {
          toast({
            title: '🔔 Yeni Sifariş!',
            description: `#${order.orderNumber}`,
            duration: 7000,
          });
          hasNotification = true;
        }
      } else if (prevStatus !== order.status) {
        if (!watchStatuses || watchStatuses.includes(order.status)) {
          toast({
            title: `${statusEmojis[order.status]} Status yeniləndi`,
            description: `#${order.orderNumber}: ${statusLabels[prevStatus]} → ${statusLabels[order.status]}`,
            duration: 7000,
          });
          hasNotification = true;
        }
      }

      prevOrdersRef.current.set(order.id, order.status);
    });

    if (hasNotification && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [fetchFn, watchStatuses]);

  useEffect(() => {
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);
};