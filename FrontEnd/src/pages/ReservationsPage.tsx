import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { Calendar, Users, ChevronLeft, Check, Armchair } from 'lucide-react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { createReservation } from '@/api/dev/reservationDev';
import { getAvailableTables } from '@/api/dev/tableDev';
import type { TableData } from '@/components/TableSelection3D';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TableSelection3D = lazy(() => import('@/components/TableSelection3D'));

const PARTY_SIZES = [1,2,3,4,5,6,7,8,9,10,11,12];

const ReservationsPage = () => {

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('12:00'); // default time
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [availableTables, setAvailableTables] = useState<TableData[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [partySize, setPartySize] = useState(2);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = startOfToday();
  const { user } = useAuth();

  // ================= FETCH TABLES =================

const fetchTables = useCallback(async () => {
  if (!selectedDate) return;

  setTablesLoading(true);

  try {
    const data = await getAvailableTables(
      format(selectedDate, "yyyy-MM-dd"),
      selectedTime,
      partySize
    );

    // 🔥 AUTO GRID LAYOUT
    const spacing = 2.2;
    const cols = Math.ceil(Math.sqrt(data.length));

    const mapped: TableData[] = data.map((raw: any, i: number) => {
      const row = Math.floor(i / cols);
      const col = i % cols;

      return {
        id: Number(raw.tableNumber),
        number: Number(raw.tableNumber),
        seats: Number(raw.capacity ?? 0),

        // 👉 AUTO POSITION (backend koordinat lazım deyil)
        position: [
          col * spacing - (cols * spacing) / 2,
          0,
          row * spacing - (cols * spacing) / 2,
        ],

        isAvailable: !raw.isBooked,
      };
    });

    setAvailableTables(mapped);

  } catch (err) {
    console.error("Fetch tables error:", err);
    setAvailableTables([]);
  } finally {
    setTablesLoading(false);
  }
}, [selectedDate, selectedTime, partySize]);
  // Auto fetch when step 3 opens
  useEffect(() => {
    if (step === 3) fetchTables();
  }, [step, selectedDate, selectedTime, partySize]);

  // ================= SUBMIT =================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTable) return;

    setIsSubmitting(true);

    try {
      await createReservation({
        userId: user?.id ?? '00000000-0000-0000-0000-000000000000',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: `${selectedTime}:00`,
        partySize,
        specialRequests: formData.specialRequests || null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
      } as any);

      toast({
        title: 'Rezervasiya Təsdiqləndi!',
        description: `Masa #${selectedTable}`,
      });

      setStep(5);

    } catch (err: any) {
      toast({
        title: 'Xəta',
        description: err?.message ?? 'Rezervasiya yaradılmadı',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= UI =================

  return (
    <CustomerLayout>
      <div className="container py-8 max-w-2xl">

        {/* STEP 1 — DATE */}
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
                      'p-2 rounded-lg',
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

            <Button
              className="mt-6 w-full"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
            >
              Davam et
            </Button>
          </div>
        )}

        {/* STEP 2 — PARTY */}
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
                    'p-4 rounded-lg',
                    partySize === size
                      ? 'bg-primary text-white'
                      : 'bg-secondary'
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

        {/* STEP 3 — TABLES */}
        {step === 3 && (
          <div className="bg-card p-6 rounded-xl shadow-card">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              Masa seç
            </h2>

            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              {tablesLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : availableTables.length > 0 ? (
                <TableSelection3D
                  selectedTable={selectedTable}
                  onTableSelect={setSelectedTable}
                  partySize={partySize}
                  tables={availableTables}
                />
              ) : (
                <div className="text-center mt-6">
                  Heç bir masa tapılmadı
                </div>
              )}
            </Suspense>

            <div className="mt-4 text-center">
              <Button variant="outline" onClick={fetchTables}>
                Yenidən yüklə
              </Button>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
              <Button disabled={!selectedTable} onClick={() => setStep(4)}>
                Davam
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — DETAILS */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-card space-y-4">
            <Input
              placeholder="Ad Soyad"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              placeholder="Telefon"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Textarea
              placeholder="Xüsusi istəklər"
              value={formData.specialRequests}
              onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
            />

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)}>Geri</Button>
              <Button type="submit" disabled={isSubmitting}>
                Təsdiqlə
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5 — DONE */}
        {step === 5 && (
          <div className="bg-card p-8 rounded-xl shadow-card text-center">
            <Check className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold mt-4">Rezervasiya tamamlandı</h2>
            <Button className="mt-6" onClick={() => window.location.href = '/'}>
              Ana səhifə
            </Button>
          </div>
        )}

      </div>
    </CustomerLayout>
  );
};

export default ReservationsPage;
