import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Phone, Check, X, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const mockReservations = [
  {
    id: '1',
    customerName: 'Əli Məmmədov',
    customerPhone: '+994501234567',
    date: '2026-01-14',
    time: '19:00',
    partySize: 4,
    status: 'pending',
    specialRequests: 'Pəncərə yanı masa',
  },
  {
    id: '2',
    customerName: 'Leyla Həsənova',
    customerPhone: '+994557654321',
    date: '2026-01-14',
    time: '20:00',
    partySize: 2,
    status: 'confirmed',
    specialRequests: null,
  },
];

export const ModeratorReservations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState(mockReservations);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission and initialize audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.5;
    
    const pendingReservations = mockReservations.filter(r => r.status === 'pending');
    previousPendingCountRef.current = pendingReservations.length;
  }, []);

  // Poll for new pending reservations
  useEffect(() => {
    const checkForPendingReservations = () => {
      const pendingReservations = reservations.filter(r => r.status === 'pending');
      const currentPendingCount = pendingReservations.length;

      if (currentPendingCount > previousPendingCountRef.current) {
        const newCount = currentPendingCount - previousPendingCountRef.current;

        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err));
        }

        toast({
          title: t('admin.newReservation'),
          description: `${newCount} ${t('admin.newReservation')}`,
          duration: 5000,
        });

        if (notificationPermission === 'granted') {
          new Notification(t('admin.newReservation'), {
            body: `${newCount}`,
            icon: '/logo.png',
            requireInteraction: true,
          });
        }
      }

      previousPendingCountRef.current = currentPendingCount;
    };

    const interval = setInterval(checkForPendingReservations, 5000);
    return () => clearInterval(interval);
  }, [reservations, notificationPermission, t]);

  const updateStatus = (id: string, status: string) => {
    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: t('moderator.pending'), variant: 'secondary' as const },
      confirmed: { label: t('moderator.confirmed'), variant: 'default' as const },
      cancelled: { label: t('moderator.cancelled'), variant: 'destructive' as const },
    };
    const s = config[status as keyof typeof config];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/moderator')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('moderator.reservations')}</h1>
          <p className="text-muted-foreground">{t('moderator.manageReservations')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reservations.map(reservation => (
          <Card key={reservation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{reservation.customerName}</CardTitle>
                {getStatusBadge(reservation.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(reservation.date).toLocaleDateString('az-AZ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{reservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{reservation.partySize} {t('moderator.guests')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${reservation.customerPhone}`} className="text-sm text-blue-600 hover:underline">
                    {reservation.customerPhone}
                  </a>
                </div>
              </div>

              {reservation.specialRequests && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium mb-1">{t('moderator.specialRequests')}:</p>
                  <p className="text-sm text-muted-foreground">{reservation.specialRequests}</p>
                </div>
              )}

              {reservation.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => updateStatus(reservation.id, 'confirmed')}>
                    <Check className="h-4 w-4 mr-2" />
                    {t('moderator.approve')}
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateStatus(reservation.id, 'cancelled')}>
                    <X className="h-4 w-4 mr-2" />
                    {t('moderator.cancelReservation')}
                  </Button>
                </div>
              )}

              {reservation.status === 'confirmed' && (
                <Button variant="destructive" className="w-full" onClick={() => updateStatus(reservation.id, 'cancelled')}>
                  <X className="h-4 w-4 mr-2" />
                  {t('moderator.cancelReservation')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
