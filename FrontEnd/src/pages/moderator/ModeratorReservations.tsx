import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Phone, Check, X, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const ReservationStatus = {
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
  Completed: 4,
  NoShow: 5,
} as const;

interface Reservation {
  id: string;
  userId: string;
  tableId?: string;
  tableNumber?: number;
  date: string;
  time: string;
  partySize: number;
  status: number;
  specialRequests?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
}

export const ModeratorReservations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.5;
    fetchReservations();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetchReservationsSilent();
      if (!fresh) return;
      const pendingCount = fresh.filter((r: Reservation) => r.status === ReservationStatus.Pending).length;
      if (pendingCount > previousPendingCountRef.current) {
        audioRef.current?.play().catch(() => {});
        toast({ title: '🔔 Yeni Rezervasiya!', description: 'Yeni rezervasiya daxil oldu', duration: 5000 });
      }
      previousPendingCountRef.current = pendingCount;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Rezervasiyalar yüklənmədi');
      const data = await res.json();
      const list: Reservation[] = Array.isArray(data) ? data : data.data ?? [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReservations(list);
      previousPendingCountRef.current = list.filter(r => r.status === ReservationStatus.Pending).length;
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationsSilent = async (): Promise<Reservation[] | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      const list: Reservation[] = Array.isArray(data) ? data : data.data ?? [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReservations(list);
      return list;
    } catch {
      return null;
    }
  };

  const updateStatus = async (reservation: Reservation, newStatus: number) => {
    setUpdatingId(reservation.id);
    // Dərhal lokal state-i yenilə ki UI cavab versin
    setReservations(prev =>
      prev.map(r => r.id === reservation.id ? { ...r, status: newStatus } : r)
    );
    try {
      const body = {
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: newStatus,
        specialRequests: reservation.specialRequests ?? null,
      };

      const res = await fetch(`${API_BASE}/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }

      toast({ title: 'Uğurlu', description: 'Status yeniləndi' });
      // Backend-dən fresh data çək
      await fetchReservationsSilent();
    } catch (err: any) {
      // Xəta olsa geri qaytar
      setReservations(prev =>
        prev.map(r => r.id === reservation.id ? { ...r, status: reservation.status } : r)
      );
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: number) => {
    const config: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      [ReservationStatus.Pending]:   { label: 'Gözləyir',    variant: 'secondary' },
      [ReservationStatus.Confirmed]: { label: 'Təsdiqlənib', variant: 'default' },
      [ReservationStatus.Cancelled]: { label: 'Ləğv edilib', variant: 'destructive' },
      [ReservationStatus.Completed]: { label: 'Tamamlandı',  variant: 'outline' },
      [ReservationStatus.NoShow]:    { label: 'Gəlmədi',     variant: 'destructive' },
    };
    const s = config[status] ?? { label: `Status ${status}`, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('az-AZ');
  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) ?? '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingReservations = reservations.filter(r => r.status === ReservationStatus.Pending);
  const otherReservations   = reservations.filter(r => r.status !== ReservationStatus.Pending);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/moderator')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('moderator.reservations', 'Rezervasiyalar')}</h1>
            <p className="text-muted-foreground">{t('moderator.manageReservations', 'Rezervasiyaları idarə edin')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchReservations}>
          <RefreshCw className="h-4 w-4 mr-2" /> Yenilə
        </Button>
      </div>

      {pendingReservations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            🔔 Gözləyən ({pendingReservations.length})
          </h2>
          {pendingReservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              updatingId={updatingId}
              onUpdate={updateStatus}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
              formatTime={formatTime}
              t={t}
            />
          ))}
        </div>
      )}

      {otherReservations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Digər rezervasiyalar ({otherReservations.length})
          </h2>
          {otherReservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              updatingId={updatingId}
              onUpdate={updateStatus}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
              formatTime={formatTime}
              t={t}
            />
          ))}
        </div>
      )}

      {reservations.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Rezervasiya yoxdur</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface CardProps {
  reservation: Reservation;
  updatingId: string | null;
  onUpdate: (r: Reservation, status: number) => void;
  getStatusBadge: (status: number) => JSX.Element;
  formatDate: (d: string) => string;
  formatTime: (t: string) => string;
  t: (key: string, fallback?: string) => string;
}

const ReservationCard = ({
  reservation, updatingId, onUpdate, getStatusBadge, formatDate, formatTime, t,
}: CardProps) => {
  const isUpdating = updatingId === reservation.id;

  return (
    <Card className={reservation.status === ReservationStatus.Pending ? 'border-yellow-400 dark:border-yellow-600' : ''}>
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
            <span className="text-sm">{formatDate(reservation.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatTime(reservation.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{reservation.partySize} {t('moderator.guests', 'nəfər')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${reservation.customerPhone}`} className="text-sm text-blue-600 hover:underline">
              {reservation.customerPhone}
            </a>
          </div>
        </div>

        {reservation.tableNumber && (
          <div className="text-sm text-muted-foreground">
            🪑 Masa: <span className="font-medium text-foreground">{reservation.tableNumber}</span>
          </div>
        )}

        {reservation.specialRequests && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-1">{t('moderator.specialRequests', 'Xüsusi tələblər')}:</p>
            <p className="text-sm text-muted-foreground">{reservation.specialRequests}</p>
          </div>
        )}

        {/* Yalnız Pending → Confirm / Cancel */}
        {reservation.status === ReservationStatus.Pending && (
          <div className="flex gap-2">
            <Button className="flex-1" disabled={isUpdating} onClick={() => onUpdate(reservation, ReservationStatus.Confirmed)}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {t('moderator.approve', 'Təsdiqlə')}
            </Button>
            <Button variant="destructive" className="flex-1" disabled={isUpdating} onClick={() => onUpdate(reservation, ReservationStatus.Cancelled)}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {t('moderator.cancelReservation', 'Ləğv et')}
            </Button>
          </div>
        )}

        {/* Yalnız Confirmed → Completed / Cancel */}
        {reservation.status === ReservationStatus.Confirmed && (
          <div className="flex gap-2">
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isUpdating} onClick={() => onUpdate(reservation, ReservationStatus.Completed)}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Tamamlandı
            </Button>
            <Button variant="destructive" className="flex-1" disabled={isUpdating} onClick={() => onUpdate(reservation, ReservationStatus.Cancelled)}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {t('moderator.cancelReservation', 'Ləğv et')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReservationStatus_const = {
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
  Completed: 4,
  NoShow: 5,
};