import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Phone, Armchair, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// ReservationStatus: 1=Pending, 2=Confirmed, 3=Cancelled, 4=Completed, 5=NoShow
const statusConfig: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: 'Gözləyir',    variant: 'secondary' },
  2: { label: 'Təsdiqlənib', variant: 'default' },
  3: { label: 'Ləğv edilib', variant: 'destructive' },
  4: { label: 'Tamamlandı',  variant: 'outline' },
  5: { label: 'Gəlmədi',     variant: 'destructive' },
};

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

export const WaiterReservations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations?page=1&take=100`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Rezervasiyalar yüklənmədi');
      const data = await res.json();
      const list: Reservation[] = Array.isArray(data) ? data : data.data ?? [];
      // Ləğv edilmişlər xaric, tarixə görə sırala
      const active = list
        .filter(r => r.status !== 3)
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.time.localeCompare(b.time);
        });
      setReservations(active);
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    const s = statusConfig[status] ?? { label: `Status ${status}`, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return t('waiter.today', 'Bu gün');
    if (date.toDateString() === tomorrow.toDateString()) return t('waiter.tomorrow', 'Sabah');
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) ?? '';

  const filteredReservations = reservations.filter(r => {
    const rDate = new Date(r.date).toDateString();
    const today = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (filter === 'today') return rDate === today;
    if (filter === 'upcoming') return new Date(r.date) >= new Date(today);
    return true;
  });

  const todayCount = reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length;
  const upcomingCount = reservations.filter(r => new Date(r.date) >= new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/waiter')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('waiter.reservations', 'Rezervasiyalar')}</h1>
            <p className="text-muted-foreground">{t('waiter.viewAllReservations', 'Bütün rezervasiyaları görüntüləyin (yalnız baxış)')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReservations} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'today',    label: `Bu gün (${todayCount})` },
          { key: 'upcoming', label: `Gələcək (${upcomingCount})` },
          { key: 'all',      label: `Hamısı (${reservations.length})` },
        ].map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Rezervasiya tapılmadı</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map(reservation => (
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
                    <span className="text-sm">{formatDate(reservation.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatTime(reservation.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.partySize} nəfər</span>
                  </div>
                  {reservation.tableNumber && (
                    <div className="flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Masa {reservation.tableNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${reservation.customerPhone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {reservation.customerPhone}
                    </a>
                  </div>
                </div>

                {reservation.specialRequests && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium mb-1">{t('waiter.specialRequests', 'Xüsusi tələblər')}:</p>
                    <p className="text-sm text-muted-foreground">{reservation.specialRequests}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    ℹ️ {t('waiter.contactAdminToModify', 'Rezervasiyanı dəyişdirmək üçün admin və ya moderatorla əlaqə saxlayın')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
