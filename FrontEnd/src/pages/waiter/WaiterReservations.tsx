import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Phone, Armchair, ArrowLeft } from 'lucide-react';

const mockReservations = [
  {
    id: '1',
    customerName: 'Əli Məmmədov',
    customerPhone: '+994501234567',
    customerEmail: 'ali@example.com',
    date: '2026-01-14',
    time: '19:00',
    partySize: 4,
    tableNumber: 5,
    status: 'confirmed',
    specialRequests: 'Pəncərə yanı masa',
  },
  {
    id: '2',
    customerName: 'Leyla Həsənova',
    customerPhone: '+994557654321',
    customerEmail: 'leyla@example.com',
    date: '2026-01-14',
    time: '20:00',
    partySize: 2,
    tableNumber: 3,
    status: 'confirmed',
    specialRequests: null,
  },
  {
    id: '3',
    customerName: 'Rəşad Quliyev',
    customerPhone: '+994701234567',
    customerEmail: 'rashad@example.com',
    date: '2026-01-14',
    time: '20:30',
    partySize: 6,
    tableNumber: 8,
    status: 'pending',
    specialRequests: 'Uşaq oturacağı lazımdır',
  },
  {
    id: '4',
    customerName: 'Nigar Əliyeva',
    customerPhone: '+994551234567',
    customerEmail: 'nigar@example.com',
    date: '2026-01-15',
    time: '19:30',
    partySize: 3,
    tableNumber: 7,
    status: 'confirmed',
    specialRequests: null,
  },
];

export const WaiterReservations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reservations] = useState(mockReservations);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: t('waiter.pending'), variant: 'secondary' as const },
      confirmed: { label: t('waiter.confirmed'), variant: 'default' as const },
      cancelled: { label: t('waiter.cancelled'), variant: 'destructive' as const },
      completed: { label: t('waiter.completed'), variant: 'default' as const },
    };

    const s = config[status as keyof typeof config] || { label: status, variant: 'default' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('waiter.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('waiter.tomorrow');
    }
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/waiter')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('waiter.reservations')}</h1>
          <p className="text-muted-foreground">{t('waiter.viewAllReservations')}</p>
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
                  <span className="text-sm">{formatDate(reservation.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{reservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{reservation.partySize} nəfər</span>
                </div>
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Masa {reservation.tableNumber}</span>
                </div>
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
                  <p className="text-sm font-medium mb-1">{t('waiter.specialRequests')}:</p>
                  <p className="text-sm text-muted-foreground">{reservation.specialRequests}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  ℹ️ {t('waiter.contactAdminToModify')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
