import { useState, lazy, Suspense, useEffect } from 'react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Check, Armchair } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { createReservation } from '@/api/dev/reservationDev';
import { getAvailableTables, GetAvailableTableDto } from '@/api/dev/tableDev';
import { getTables } from '@/api/dev/tableDev';
import type { TableData } from '@/components/TableSelection3D';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TableSelection3D = lazy(() => import('@/components/TableSelection3D'));

// Get available time slots based on selected date
const getTimeSlots = (date: Date | null) => {
  if (!date) return [];
  
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    // Weekend: 11:00 - 19:00 (last reservation 1 hour before 20:00 closing)
    return [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00',
    ];
  } else {
    // Weekday: 9:00 - 21:00 (last reservation 1 hour before 22:00 closing)
    return [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
    ];
  }
};

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const ReservationsPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [availableTables, setAvailableTables] = useState<TableData[] | null>(null);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [lastRawTables, setLastRawTables] = useState<any>(null);
  const [partySize, setPartySize] = useState(2);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = startOfToday();
  const maxDate = addDays(today, 30);

  // Generate calendar days
  const generateCalendarDays = () => {
    const days: Date[] = [];
    let current = today;
    while (isBefore(current, maxDate) || format(current, 'yyyy-MM-dd') === format(maxDate, 'yyyy-MM-dd')) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const { user } = useAuth();

  // If backend doesn't provide positions, arrange tables in a grid to avoid overlap
  const assignGridPositions = (tables: TableData[]) => {
    if (!tables || tables.length === 0) return tables;
    const allZero = tables.every(t => (!t.position || (t.position[0] === 0 && t.position[2] === 0)));
    if (!allZero) return tables;

    const n = tables.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const spacing = 2.6; // gap between table centers
    const startX = -((cols - 1) / 2) * spacing;
    const startZ = -((rows - 1) / 2) * spacing;

    return tables.map((t, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * spacing;
      const z = startZ + row * spacing;
      return { ...t, position: [x, 0, z] as [number, number, number] };
    });
  };

  // Normalize backend positions to fit the 3D floor bounds and place tables without positions into a nearby grid
  const normalizeBackendPositions = (tables: TableData[]) => {
    if (!tables || tables.length === 0) return tables;
    const EPS = 0.0001;
    const withPos = tables.filter(t => Math.abs(t.position?.[0] || 0) > EPS || Math.abs(t.position?.[2] || 0) > EPS);
    const noPos = tables.filter(t => !(Math.abs(t.position?.[0] || 0) > EPS || Math.abs(t.position?.[2] || 0) > EPS));

    const BOUNDS = { minX: -5.5, maxX: 5.5, minZ: -5, maxZ: 5 };

    if (withPos.length === 0) {
      return assignGridPositions(tables);
    }

    // Compute extents of backend coordinates (use raw numbers)
    const xs = withPos.map(t => Number(t.position[0]));
    const zs = withPos.map(t => Number(t.position[2]));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const targetMinX = BOUNDS.minX + 0.5;
    const targetMaxX = BOUNDS.maxX - 0.5;
    const targetMinZ = BOUNDS.minZ + 0.5;
    const targetMaxZ = BOUNDS.maxZ - 0.5;

    const scaleX = (maxX - minX) === 0 ? 1 : (targetMaxX - targetMinX) / (maxX - minX);
    const scaleZ = (maxZ - minZ) === 0 ? 1 : (targetMaxZ - targetMinZ) / (maxZ - minZ);

    const normalizedWithPos = withPos.map(t => {
      const rawX = Number(t.position[0]);
      const rawZ = Number(t.position[2]);
      const nx = (rawX - minX) * scaleX + targetMinX;
      const nz = (rawZ - minZ) * scaleZ + targetMinZ;
      return { ...t, position: [nx, 0, nz] as [number, number, number] };
    });

    // Place noPos tables in a small grid to the right of maxX if space permits, otherwise fallback to center grid
    const spacing = 2.6;
    const startXRight = Math.min(targetMaxX - spacing, (normalizedWithPos.length ? Math.max(...normalizedWithPos.map(p => p.position[0])) + spacing : targetMinX));
    const canPlaceRight = startXRight + spacing <= BOUNDS.maxX;

    if (noPos.length === 0) return normalizedWithPos;

    if (canPlaceRight) {
      const cols = Math.ceil(Math.sqrt(noPos.length));
      const rows = Math.ceil(noPos.length / cols);
      const sx = startXRight + spacing;
      const szStart = targetMinZ;
      const positionedNoPos = noPos.map((t, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = sx + col * spacing;
        const z = szStart + row * spacing;
        return { ...t, position: [x, 0, z] as [number, number, number] };
      });
      return [...normalizedWithPos, ...positionedNoPos];
    }

    // Fallback: assign grid for all
    return assignGridPositions(tables.map(t => ({ ...t })));
  };

  // Fetch available tables from backend when reaching table selection step
  useEffect(() => {
    if (step !== 3 || !selectedDate || !selectedTime) return;

    setTablesLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = `${selectedTime}:00`;

    getAvailableTables(dateStr, timeStr, partySize)
      .then((data: any) => {
        console.debug('Available tables (raw):', data);
        setLastRawTables(data);
        const items: any[] = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        let mapped = items.map((t) => {
          const raw: any = t as any;
          const isAvailable = typeof raw.isAvailable === 'boolean' ? raw.isAvailable : (typeof raw.isBooked === 'boolean' ? !raw.isBooked : true);
          return {
            id: raw.tableNumber ?? Number(raw.id) ?? 0,
            number: raw.tableNumber ?? 0,
            seats: raw.capacity ?? raw.seats ?? 2,
            position: [Number(raw.positionX ?? raw.x ?? 0) || 0, 0, Number(raw.positionY ?? raw.y ?? 0) || 0] as [number, number, number],
            isAvailable,
          };
        });

        // Normalize backend positions into the floor bounds and assign grid for missing positions
        mapped = normalizeBackendPositions(mapped);
        setAvailableTables(mapped);
        // reset selected table if it no longer exists
        setSelectedTable((prev) => {
          if (!prev) return prev;
          const exists = mapped.some(m => m.number === prev);
          return exists ? prev : null;
        });
      })
      .catch((err) => {
        console.error('Error loading available tables', err);
        setAvailableTables(null);
      })
      .finally(() => setTablesLoading(false));
  }, [step, selectedDate, selectedTime, partySize]);

  // Manual fetch for retry button (exposed for debugging)
  const fetchTables = () => {
    if (!selectedDate || !selectedTime) return;
    setTablesLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = `${selectedTime}:00`;

    (async () => {
      try {
        const data = await getAvailableTables(dateStr, timeStr, partySize);
        console.debug('Manual fetch available tables (raw):', data);
        setLastRawTables(data);

        const items: any[] = Array.isArray(data) ? data : (data && Array.isArray(data.availableTables) ? data.availableTables : (data && Array.isArray(data.data) ? data.data : []));

        let mapped = items.map((raw: any) => ({
          id: raw.tableNumber ?? Number(raw.id) ?? 0,
          number: raw.tableNumber ?? 0,
          seats: raw.capacity ?? raw.seats ?? 2,
          position: [Number(raw.positionX ?? raw.x ?? 0) || 0, 0, Number(raw.positionY ?? raw.y ?? 0) || 0] as [number, number, number],
          isAvailable: typeof raw.isAvailable === 'boolean' ? raw.isAvailable : (typeof raw.isBooked === 'boolean' ? !raw.isBooked : true),
        }));

        mapped = normalizeBackendPositions(mapped);

        if (mapped.length === 0) {
          // fallback to fetching all tables layout
          try {
            const all = await getTables();
            const listSource: any[] = Array.isArray(all) ? all : (all && Array.isArray((all as any).data) ? (all as any).data : []);
            mapped = listSource.map((raw: any) => ({
              id: raw.tableNumber ?? Number(raw.id) ?? 0,
              number: raw.tableNumber ?? 0,
              seats: raw.capacity ?? raw.seats ?? 2,
              position: [Number(raw.positionX ?? raw.x ?? 0) || 0, 0, Number(raw.positionY ?? raw.y ?? 0) || 0] as [number, number, number],
              isAvailable: typeof raw.isAvailable === 'boolean' ? raw.isAvailable : true,
            }));
            mapped = normalizeBackendPositions(mapped);
          } catch (err) {
            console.error('Fallback getTables() failed', err);
            setAvailableTables([]);
            return;
          }
        }

        setAvailableTables(mapped);
      } catch (err) {
        console.error('Manual fetch error', err);
        setAvailableTables(null);
      } finally {
        setTablesLoading(false);
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedTable) return;

    setIsSubmitting(true);

    try {
      const dto = {
        userId: user?.id || '00000000-0000-0000-0000-000000000000',
        tableId: null,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: `${selectedTime}:00`,
        partySize,
        specialRequests: formData.specialRequests || null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
      };

      await createReservation(dto as any);

      toast({
        title: 'Rezervasiya Təsdiqləndi!',
        description: `${format(selectedDate, 'MMMM d')} tarixində saat ${selectedTime}-da Masa #${selectedTable} üçün ${partySize} nəfərlik rezervasiya edildi.`,
      });

      setStep(5);
    } catch (err: any) {
      console.error('Create reservation error', err);
      toast({
        title: 'Xəta',
        description: err?.response?.data?.message || err?.message || 'Rezervasiya yaradılmadı',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      {/* Header */}
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
            {t('reservations.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('reservations.subtitle')}
          </p>
        </div>
      </section>

      <div className="container py-8">
        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2">
            {[t('reservations.selectDate'), t('reservations.guests'), t('reservations.selectTable'), t('reservations.details'), t('reservations.confirmation')].map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    step > idx + 1
                      ? 'bg-success text-success-foreground'
                      : step === idx + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > idx + 1 ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'hidden text-sm whitespace-nowrap lg:block',
                    step === idx + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
                {idx < 4 && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
              <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
                <Calendar className="h-5 w-5 text-primary" />
                {t('reservations.dateTimeSelect')}
              </h2>

              {/* Date Selection */}
              <div className="mb-6">
                <Label className="mb-3 block">{t('reservations.selectDateLabel')}</Label>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.slice(0, 14).map(date => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'flex flex-col items-center rounded-lg p-2 text-sm transition-colors',
                        selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      <span className="text-xs opacity-70">
                        {format(date, 'EEE')}
                      </span>
                      <span className="font-medium">
                        {format(date, 'd')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="animate-fade-in">
                  <Label className="mb-3 block">{t('reservations.selectTime')}</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {getTimeSlots(selectedDate).map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          selectedTime === time
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Button */}
              <Button
                variant="hero"
                className="mt-8 w-full"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
              >
                {t('reservations.continue')}
              </Button>
            </div>
          )}

          {/* Step 2: Party Size */}
          {step === 2 && (
            <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
              <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
                <Users className="h-5 w-5 text-primary" />
                {t('reservations.guests')}
              </h2>

              <div className="grid grid-cols-4 gap-3">
                {PARTY_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setPartySize(size);
                      setSelectedTable(null); // Reset table when party size changes
                    }}
                    className={cn(
                      'rounded-lg py-4 text-center transition-all',
                      partySize === size
                        ? 'bg-primary text-primary-foreground shadow-warm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    <span className="text-2xl font-bold">{size}</span>
                    <span className="mt-1 block text-xs opacity-70">
                      {t('reservations.guestCount')}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t('reservations.largePartyContact')} +994 (12) 345-67-89
              </p>

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4" />
                  {t('reservations.back')}
                </Button>
                <Button variant="hero" className="flex-1" onClick={() => setStep(3)}>
                  {t('reservations.continue')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Table Selection */}
          {step === 3 && (
            <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
              <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
                <Armchair className="h-5 w-5 text-primary" />
                {t('reservations.chooseTable')}
              </h2>

              <p className="mb-4 text-sm text-muted-foreground">
                {t('reservations.tableViewInfo')}
              </p>

              <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-stone-900">
                  <div className="text-center">
                    <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                    <p className="mt-4 text-sm text-muted-foreground">{t('reservations.loading3D')}</p>
                  </div>
                </div>
              }>
                {tablesLoading ? (
                  <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-stone-900">
                    <div className="text-center">
                      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                      <p className="mt-4 text-sm text-muted-foreground">{t('reservations.loading3D')}</p>
                    </div>
                  </div>
                ) : (
                  <TableSelection3D
                    selectedTable={selectedTable}
                    onTableSelect={setSelectedTable}
                    partySize={partySize}
                    tables={availableTables ?? undefined}
                  />
                )}
              </Suspense>

                {/* Debug / Empty state for tables */}
                {!tablesLoading && (!availableTables || availableTables.length === 0) && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">{t('reservations.noTablesFound') || 'Heç bir masa tapılmadı.'}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={fetchTables}>{t('reservations.retry') || 'Yenidən yüklə'}</Button>
                    </div>
                    {lastRawTables && (
                      <details className="w-full max-w-2xl bg-secondary p-3 rounded mt-3 text-xs">
                        <summary className="cursor-pointer font-medium">Raw response (debug)</summary>
                        <pre className="mt-2 max-h-48 overflow-auto">{JSON.stringify(lastRawTables, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                )}

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4" />
                  {t('reservations.back')}
                </Button>
                <Button 
                  variant="hero" 
                  className="flex-1" 
                  onClick={() => setStep(4)}
                  disabled={!selectedTable}
                >
                  {t('reservations.continue')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Contact Details */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
              <h2 className="mb-6 font-display text-xl font-semibold">
                {t('reservations.peopleInfo')}
              </h2>

              {/* Summary */}
              <div className="mb-6 rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('reservations.date')}</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('reservations.time')}</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('reservations.party')}</span>
                  <span className="font-medium">{partySize} {t('reservations.guestCount')}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('reservations.table')}</span>
                  <span className="font-medium">{t('reservations.tableNumber')}{selectedTable}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('reservations.fullName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('reservations.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('reservations.phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="requests">{t('reservations.specialRequestsOptional')}</Label>
                  <Textarea
                    id="requests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder={t('reservations.specialRequestsPlaceholder')}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  <ChevronLeft className="h-4 w-4" />
                  {t('reservations.back')}
                </Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                  {t('reservations.confirmReservation')}
                </Button>
              </div>
            </form>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="animate-scale-in rounded-xl bg-card p-8 text-center shadow-card">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success">
                <Check className="h-8 w-8 text-success-foreground" />
              </div>
              <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
                {t('reservations.reservationConfirmed')}
              </h2>
              <p className="mb-6 text-muted-foreground">
                {t('reservations.reservationSuccess')}
              </p>

              <div className="mb-8 rounded-lg bg-secondary p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reservations.date')}</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reservations.time')}</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reservations.table')}</span>
                    <span className="font-medium">{t('reservations.tableNumber')}{selectedTable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reservations.party')}</span>
                    <span className="font-medium">{partySize} {t('reservations.guestCount')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('reservations.name')}</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                </div>
              </div>

              <Button variant="hero" onClick={() => window.location.href = '/'}>
                {t('reservations.backToHome')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ReservationsPage;
