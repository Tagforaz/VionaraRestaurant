import { useState, lazy, Suspense, useEffect } from 'react';
import { format, startOfToday, isToday } from 'date-fns';
import { Calendar, Users, Clock, Armchair, Check, ShieldX } from 'lucide-react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { backendToPlatformPosition } from '@/utils/TablePositionUtils';
import type { TableData } from '@/components/TableSelection3D';

const TableSelection3D = lazy(() => import('@/components/TableSelection3D'));

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

const STAFF_ROLES = ['admin', 'moderator', 'chef', 'courier', 'waiter'];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ALL_TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

interface TableWithId extends TableData {
  tableId: string;
}

const ReservationsPage = () => {
  const { user } = useAuth();

  // ── Staff yoxlaması ──────────────────────────────────────────────────────
  if (user && STAFF_ROLES.includes(user.role ?? '')) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Giriş icazəniz yoxdur</h2>
          <p className="text-muted-foreground max-w-sm">
            Staff hesabları rezervasiya edə bilməz. Bu funksiya yalnız müştərilər üçündür.
          </p>
        </div>
      </CustomerLayout>
    );
  }

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<TableWithId[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const today = startOfToday();

  const availableTimeSlots = (() => {
    if (!selectedDate) return ALL_TIME_SLOTS;
    if (!isToday(selectedDate)) return ALL_TIME_SLOTS;
    const now = new Date();
    const currentHour = now.getHours();
    return ALL_TIME_SLOTS.filter(slot => {
      const slotHour = parseInt(slot.split(':')[0], 10);
      return slotHour > currentHour;
    });
  })();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email ?? '',
        phone: (user as any).phone || (user as any).phoneNumber || '',
      }));
    }
  }, [user?.id, (user as any)?.phone, (user as any)?.phoneNumber]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      if (!availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(null);
      }
    }
  }, [selectedDate]);

  const fetchTables = async () => {
    if (!selectedDate || !selectedTime) return;
    setTablesLoading(true);
    try {
      const allRes = await fetch(`${API_BASE}/api/tables?page=1&take=100`);
      const allData = await allRes.json();
      const allList: any[] = Array.isArray(allData) ? allData : allData.data ?? allData.items ?? [];

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      let reservedTableIds = new Set<string>();
      try {
        const resRes = await fetch(
          `${API_BASE}/api/reservations?page=1&take=100&date=${dateStr}`,
          { headers: user ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } : {} }
        );
        if (resRes.ok) {
          const resData = await resRes.json();
          const resList: any[] = Array.isArray(resData) ? resData : resData.data ?? resData.items ?? [];
          resList
            .filter((r: any) => {
              if (!r.tableId || r.status === 3 || r.status === 'Cancelled') return false;
              const resTime = (r.time ?? '').substring(0, 5);
              return resTime === selectedTime;
            })
            .forEach((r: any) => reservedTableIds.add(r.tableId));
        }
      } catch { }

      const mapped: TableWithId[] = allList.map((raw: any) => {
        const position = backendToPlatformPosition(raw.positionX ?? 0, raw.positionY ?? 0);
        const isReserved = reservedTableIds.has(raw.id);
        return {
          id: raw.tableNumber,
          number: raw.tableNumber,
          seats: raw.capacity,
          position,
          isAvailable: raw.isAvailable && raw.capacity >= partySize && !isReserved,
          tableId: raw.id,
        };
      });

      setAvailableTables(mapped);
    } catch {
      setAvailableTables([]);
      toast({ title: 'Xəta', description: 'Masalar yüklənmədi', variant: 'destructive' });
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    if (step === 4) {
      setSelectedTableNumber(null);
      setSelectedTableId(null);
      fetchTables();
    }
  }, [step]);

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTableNumber(tableNumber);
    const table = availableTables.find(t => t.number === tableNumber);
    setSelectedTableId(table?.tableId ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTableId || !selectedTime) return;

    if (!user) {
      toast({
        title: 'Giriş tələb olunur',
        description: 'Rezervasiya etmək üçün hesabınıza daxil olun',
        variant: 'destructive',
      });
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        userId: user?.id ?? '00000000-0000-0000-0000-000000000000',
        tableId: selectedTableId,
        date: format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00',
        time: `${selectedTime}:00`,
        partySize,
        specialRequests: formData.specialRequests || null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
      };

      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Rezervasiya yaradılmadı');
      }

      toast({ title: 'Rezervasiya Təsdiqləndi!', description: `Masa #${selectedTableNumber}, ${selectedTime}` });
      setStep(6);
    } catch (err: any) {
      toast({ title: 'Xəta', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container py-8 max-w-2xl">

        {/* Progress */}
        <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
          {['Tarix', 'Nəfər', 'Saat', 'Masa', 'Məlumat'].map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                step > i + 1 ? 'bg-primary text-white' :
                step === i + 1 ? 'bg-primary text-white' : 'bg-secondary'
              )}>
                {step > i + 1 ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={step === i + 1 ? 'text-foreground font-medium' : ''}>{label}</span>
              {i < 4 && <div className="w-6 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* STEP 1 — TARİX */}
        {step === 1 && (
          <div className="bg-card p-6 rounded-xl shadow-card">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tarix seç
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'p-2 rounded-lg text-sm font-medium',
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-primary text-white'
                        : 'bg-secondary'
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
            <Button className="mt-6 w-full" disabled={!selectedDate} onClick={() => setStep(2)}>
              Davam et
            </Button>
          </div>
        )}

        {/* STEP 2 — NƏFƏR SAYI */}
        {step === 2 && (
          <div className="bg-card p-6 rounded-xl shadow-card">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nəfər sayı
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {PARTY_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={cn(
                    'p-4 rounded-lg font-medium',
                    partySize === size ? 'bg-primary text-white' : 'bg-secondary'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Geri</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Davam</Button>
            </div>
          </div>
        )}

        {/* STEP 3 — SAAT */}
        {step === 3 && (
          <div className="bg-card p-6 rounded-xl shadow-card">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Saat seç
            </h2>
            {selectedDate && isToday(selectedDate) && (
              <p className="text-xs text-muted-foreground mb-3">
                ℹ️ Bu gün üçün yalnız cari saatdan sonrakı saatlar göstərilir
              </p>
            )}
            {availableTimeSlots.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Bu gün üçün mövcud saat qalmayıb.</p>
                <p className="text-sm mt-1">Zəhmət olmasa başqa gün seçin.</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>Tarix dəyiş</Button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {availableTimeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'p-3 rounded-lg text-sm font-medium',
                      selectedTime === time ? 'bg-primary text-white' : 'bg-secondary'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
              <Button className="flex-1" disabled={!selectedTime || availableTimeSlots.length === 0} onClick={() => setStep(4)}>
                Davam
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — MASA */}
        {step === 4 && (
          <div className="bg-card p-6 rounded-xl shadow-card">
            <h2 className="mb-2 text-xl font-semibold flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              Masa seç
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedDate && format(selectedDate, 'dd.MM.yyyy')} · {selectedTime} · {partySize} nəfər
            </p>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              {tablesLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : availableTables.length > 0 ? (
                <TableSelection3D
                  selectedTable={selectedTableNumber}
                  onTableSelect={handleTableSelect}
                  partySize={partySize}
                  tables={availableTables}
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  Heç bir masa tapılmadı
                </div>
              )}
            </Suspense>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={fetchTables}>Yenidən yüklə</Button>
            </div>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>Geri</Button>
              <Button className="flex-1" disabled={!selectedTableNumber} onClick={() => setStep(5)}>Davam</Button>
            </div>
          </div>
        )}

        {/* STEP 5 — MƏLUMATLAR */}
        {step === 5 && (
          <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-card space-y-4">
            <h2 className="text-xl font-semibold mb-2">Məlumatlarınız</h2>
            {selectedDate && selectedTime && selectedTableNumber && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary space-y-1">
                <p>📅 {format(selectedDate, 'dd.MM.yyyy')} · ⏰ {selectedTime}</p>
                <p>👤 {partySize} nəfər · 🪑 Masa #{selectedTableNumber}</p>
              </div>
            )}
            <Input placeholder="Ad Soyad" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <Input placeholder="Telefon" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
            <Textarea placeholder="Xüsusi istəklər (isteğe bağlı)" value={formData.specialRequests} onChange={e => setFormData({ ...formData, specialRequests: e.target.value })} />
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>Geri</Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Göndərilir...' : 'Təsdiqlə'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 6 — TAMAMLANDI */}
        {step === 6 && (
          <div className="bg-card p-8 rounded-xl shadow-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Rezervasiya tamamlandı!</h2>
            <p className="mt-2 text-muted-foreground">
              {selectedDate && format(selectedDate, 'dd.MM.yyyy')} · {selectedTime} · Masa #{selectedTableNumber}
            </p>
            <Button className="mt-6" onClick={() => window.location.href = '/'}>Ana səhifə</Button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default ReservationsPage;