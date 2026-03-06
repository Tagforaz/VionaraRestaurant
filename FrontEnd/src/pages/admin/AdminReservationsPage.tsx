import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TableSelection3D, { TableData } from '@/components/TableSelection3D';
import { toast } from 'sonner';
import { backendToPlatformPosition } from '@/utils/tablePositionUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';
const POLL_INTERVAL = 15_000;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
});

const statusLabels: Record<number | string, string> = {
  1: 'Pending', 2: 'Confirmed', 3: 'Cancelled', 4: 'Completed', 5: 'NoShow',
  Pending: 'Pending', Confirmed: 'Confirmed', Cancelled: 'Cancelled',
  Completed: 'Completed', NoShow: 'NoShow',
};
const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-gray-100 text-gray-800',
  NoShow: 'bg-orange-100 text-orange-800',
};

const PLATFORM_BOUNDS = { minX: -5.5, maxX: 5.5, minZ: -5, maxZ: 5 };
const PLATFORM_RANGE_X = PLATFORM_BOUNDS.maxX - PLATFORM_BOUNDS.minX;
const PLATFORM_RANGE_Z = PLATFORM_BOUNDS.maxZ - PLATFORM_BOUNDS.minZ;

function platformToBackendPosition(platformX: number, platformZ: number) {
  const positionX = Math.max(0, Math.min(100, ((Number(platformX) - PLATFORM_BOUNDS.minX) / PLATFORM_RANGE_X) * 100));
  const positionY = Math.max(0, Math.min(100, ((Number(platformZ) - PLATFORM_BOUNDS.minZ) / PLATFORM_RANGE_Z) * 100));
  return { positionX, positionY };
}

function loadPositionMap(): Record<string, [number, number, number]> {
  try {
    const saved = localStorage.getItem('tablePositions');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function savePositionMap(tables: TableData[]) {
  const map: Record<string, [number, number, number]> = {};
  tables.forEach(t => { map[String(t.number)] = t.position; });
  localStorage.setItem('tablePositions', JSON.stringify(map));
}

function playBeep(type: 'new' | 'update' = 'new') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (type === 'new') {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch { }
}

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber: number | null;
  tableId: string | null;
  status: number | string;
  specialRequests?: string | null;
}

const AdminReservationsPage = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTables, setEditingTables] = useState(false);

  const [adminTables, setAdminTables] = useState<TableData[]>([]);
  const [tableIdMap, setTableIdMap] = useState<Map<number, string>>(new Map());
  const [selectedAdminTable, setSelectedAdminTable] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [tablesLoading, setTablesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const adminTablesRef = useRef<TableData[]>([]);
  const prevSnapshotRef = useRef<Map<string, number | string>>(new Map());
  const isFirstFetchRef = useRef(true);

  const MOVE_STEP = 0.5;

  useEffect(() => { adminTablesRef.current = adminTables; }, [adminTables]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const unlock = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctx.resume();
      } catch { }
    };
    document.addEventListener('click', unlock, { once: true });
    return () => document.removeEventListener('click', unlock);
  }, []);

  const reservedTableNumbers = reservations
    .filter(r => statusLabels[r.status] !== 'Cancelled')
    .map(r => r.tableNumber)
    .filter(Boolean) as number[];

  // ─── FETCH + DIFF ─────────────────────────────────────────────────────────

  const fetchReservations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: Reservation[] = Array.isArray(data) ? data : data.data ?? data.items ?? [];

      if (isFirstFetchRef.current) {
        const snap = new Map<string, number | string>();
        list.forEach(r => snap.set(r.id, r.status));
        prevSnapshotRef.current = snap;
        isFirstFetchRef.current = false;
      } else {
        const prev = prevSnapshotRef.current;
        const newSnap = new Map<string, number | string>();

        list.forEach(r => {
          newSnap.set(r.id, r.status);
          const prevStatus = prev.get(r.id);

          if (prevStatus === undefined) {
            playBeep('new');
            toast.success(`🆕 Yeni rezervasiya: ${r.customerName}`, {
              description: `${new Date(r.date).toLocaleDateString('az-AZ')} saat ${(r.time ?? '').substring(0, 5)} • ${r.partySize} nəfər`,
              duration: 8000,
            });
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🆕 Yeni Rezervasiya!', {
                body: `${r.customerName} — ${r.partySize} nəfər, ${new Date(r.date).toLocaleDateString('az-AZ')}`,
                icon: '/favicon.ico',
              });
            }
          } else if (String(prevStatus) !== String(r.status)) {
            const oldLabel = statusLabels[prevStatus] ?? String(prevStatus);
            const newLabel = statusLabels[r.status] ?? String(r.status);
            playBeep('update');
            toast.info(`🔄 Rezervasiya yeniləndi: ${r.customerName}`, {
              description: `${oldLabel} → ${newLabel}`,
              duration: 6000,
            });
          }
        });

        prevSnapshotRef.current = newSnap;
      }

      setReservations(list);
    } catch {
      if (!silent) toast.error('Rezervasiyalar yüklənmədi');
      setReservations([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    setTablesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tables?page=1&take=100`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data ?? data.items ?? [];

      const idMap = new Map<number, string>();
      const savedPositions = loadPositionMap();

      const mapped: TableData[] = list.map((raw: any) => {
        idMap.set(raw.tableNumber, raw.id);
        const fromBackend = backendToPlatformPosition(raw.positionX ?? 0, raw.positionY ?? 0);
        const position = savedPositions[String(raw.tableNumber)] ?? fromBackend;
        return {
          id: raw.tableNumber,
          number: raw.tableNumber,
          seats: raw.capacity,
          position,
          isAvailable: raw.isAvailable ?? true,
        };
      });

      setTableIdMap(idMap);
      setAdminTables(mapped);
    } catch {
      setAdminTables([]);
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    fetchTables();

    const interval = setInterval(() => fetchReservations(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchReservations, fetchTables]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  // ✅ Təsdiqlə — status 2 (Confirmed) → backend təsdiq emaili göndərir
  const handleConfirm = async (reservation: Reservation) => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          date: reservation.date,
          time: reservation.time,
          partySize: reservation.partySize,
          status: 2,
          specialRequests: reservation.specialRequests ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Rezervasiya təsdiqləndi');
      fetchReservations();
    } catch {
      toast.error('Təsdiqləmə alınmadı');
    }
  };

  // ✅ Ləğv et — status 3 (Cancelled) → backend ləğv emaili göndərir
  const handleCancel = async (reservation: Reservation) => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          date: reservation.date,
          time: reservation.time,
          partySize: reservation.partySize,
          status: 3,
          specialRequests: reservation.specialRequests ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Rezervasiya ləğv edildi');
      fetchReservations();
    } catch {
      toast.error('Ləğv etmə alınmadı');
    }
  };

  // ✅ Sil — DB-dən tamamilə silinir, email göndərilmir
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success('Rezervasiya silindi');
      prevSnapshotRef.current.delete(id);
      fetchReservations();
    } catch {
      toast.error('Silmə alınmadı');
    }
  };

  // ─── TABLE MOVE ───────────────────────────────────────────────────────────

  const moveTable = useCallback((dx: number, dz: number) => {
    if (!selectedAdminTable) return;
    const next = adminTables.map(t => {
      if (t.number !== selectedAdminTable) return t;
      return { ...t, position: [t.position[0] + dx, t.position[1], t.position[2] + dz] as [number, number, number] };
    });
    setAdminTables(next);
    savePositionMap(next);
  }, [adminTables, selectedAdminTable]);

  useEffect(() => {
    if (!editingTables) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedAdminTable) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); moveTable(0, -MOVE_STEP); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveTable(0, MOVE_STEP); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveTable(-MOVE_STEP, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveTable(MOVE_STEP, 0); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingTables, selectedAdminTable, moveTable]);

  const handleTablesChange = useCallback((next: TableData[]) => {
    setAdminTables(next);
    savePositionMap(next);
  }, []);

  // ─── SAVE TABLE ───────────────────────────────────────────────────────────

  const handleSaveTable = async (table: TableData) => {
    try {
      const tableNumber = Number(table.number);
      const capacity = Number(table.seats) || 1;
      if (!tableNumber || tableNumber < 1) { toast.error('Stol nömrəsi düzgün deyil'); return; }
      const databaseId = tableIdMap.get(table.number);
      if (!databaseId) { toast.error('Table ID not found'); return; }

      const { positionX, positionY } = platformToBackendPosition(table.position[0], table.position[2]);
      await fetch(`${API_BASE}/api/tables/${databaseId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          tableNumber, capacity, isAvailable: table.isAvailable,
          positionX, positionY, rotation: (table as any).rotation ?? 0,
        }),
      });

      const savedPositions = loadPositionMap();
      savedPositions[String(table.number)] = table.position;
      localStorage.setItem('tablePositions', JSON.stringify(savedPositions));

      await fetchTables();
      toast.success('Table updated successfully');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update table');
    }
  };

  const handleDeleteTable = async (table: TableData) => {
    try {
      const databaseId = tableIdMap.get(table.number);
      if (!databaseId) { toast.error('Table ID not found'); return; }
      await fetch(`${API_BASE}/api/tables/${databaseId}`, { method: 'DELETE', headers: authHeaders() });
      const next = adminTables.filter(t => t.number !== table.number);
      setAdminTables(next);
      setSelectedAdminTable(null);
      savePositionMap(next);
      toast.success('Table deleted successfully');
    } catch {
      toast.error('Failed to delete table');
    }
  };

  const handleAddTable = async () => {
    try {
      const nextNumber = Math.max(0, ...adminTables.map(t => t.number)) + 1;
      const createRes = await fetch(`${API_BASE}/api/tables`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tableNumber: nextNumber, capacity: 4 }),
      });
      if (!createRes.ok) throw new Error();

      const listRes = await fetch(`${API_BASE}/api/tables?page=1&take=100`);
      const listData = await listRes.json();
      const list: any[] = Array.isArray(listData) ? listData : listData.data ?? listData.items ?? [];
      const newTable = list.find((t: any) => t.tableNumber === nextNumber);
      if (!newTable) { toast.error('Yeni stol tapılmadı'); return; }

      const { positionX: centerX, positionY: centerZ } = platformToBackendPosition(0, 0);
      await fetch(`${API_BASE}/api/tables/${newTable.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ tableNumber: nextNumber, capacity: 4, isAvailable: true, positionX: centerX, positionY: centerZ, rotation: 0 }),
      });

      await fetchTables();
      setSelectedAdminTable(nextNumber);
      toast.success('Stol əlavə edildi. Ox düymələri ilə köçürə bilərsiniz.');
    } catch {
      toast.error('Stol əlavə edilmədi');
    }
  };

  // ─── FILTER ───────────────────────────────────────────────────────────────

  const filteredReservations = reservations.filter(r => {
    const matchesSearch =
      (r.id?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (r.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (r.customerEmail?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    const statusLabel = statusLabels[r.status] ?? String(r.status);
    const matchesStatus = statusFilter === 'all' || statusLabel === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.reservations')}</h1>
            <p className="text-muted-foreground">{t('admin.manageReservations')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant={editingTables ? 'destructive' : 'default'} onClick={() => setEditingTables(v => !v)}>
              {editingTables ? t('admin.confirmChanges') : t('admin.editTables')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchReservations')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('admin.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
              <SelectItem value="Pending">{t('admin.pending')}</SelectItem>
              <SelectItem value="Confirmed">{t('admin.confirmed')}</SelectItem>
              <SelectItem value="Cancelled">{t('admin.cancelled')}</SelectItem>
              <SelectItem value="Completed">{t('admin.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müştəri</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Tarix</TableHead>
                  <TableHead>Saat</TableHead>
                  <TableHead>Nəfər</TableHead>
                  <TableHead>Masa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Əməliyyat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Yüklənir...</TableCell></TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Rezervasiya tapılmadı</TableCell></TableRow>
                ) : filteredReservations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell>{r.customerEmail}</TableCell>
                    <TableCell>{r.customerPhone}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString('az-AZ')}</TableCell>
                    <TableCell>{(r.time ?? '').substring(0, 5)}</TableCell>
                    <TableCell>{r.partySize}</TableCell>
                    <TableCell>{r.tableNumber ? `Masa ${r.tableNumber}` : '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[statusLabels[r.status] ?? 'Pending']}>
                        {statusLabels[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">

                        {/* ── Pending: ✅ Təsdiqlə + 🟡 Ləğv et + 🗑️ Sil ── */}
                        {(r.status === 1 || r.status === 'Pending') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Təsdiqlə"
                              onClick={() => { if (window.confirm('Rezervasiyanı təsdiqləmək istəyirsiniz?')) handleConfirm(r); }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              title="Ləğv et"
                              onClick={() => { if (window.confirm('Rezervasiyanı ləğv etmək istəyirsiniz? Müştəriyə email göndəriləcək.')) handleCancel(r); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-red-700 hover:bg-red-50"
                              title="Sil"
                              onClick={() => { if (window.confirm('Rezervasiyanı silmək istəyirsiniz? Bu əməliyyat geri alına bilməz.')) handleDelete(r.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* ── Confirmed: 🟡 Ləğv et + 🗑️ Sil ── */}
                        {(r.status === 2 || r.status === 'Confirmed') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              title="Ləğv et"
                              onClick={() => { if (window.confirm('Təsdiqlənmiş rezervasiyanı ləğv etmək istəyirsiniz? Müştəriyə email göndəriləcək.')) handleCancel(r); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-red-700 hover:bg-red-50"
                              title="Sil"
                              onClick={() => { if (window.confirm('Rezervasiyanı silmək istəyirsiniz? Bu əməliyyat geri alına bilməz.')) handleDelete(r.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* ── Cancelled / Completed / NoShow: yalnız 🗑️ Sil ── */}
                        {(r.status === 3 || r.status === 'Cancelled' ||
                          r.status === 4 || r.status === 'Completed' ||
                          r.status === 5 || r.status === 'NoShow') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-red-700 hover:bg-red-50"
                            title="Sil"
                            onClick={() => { if (window.confirm('Rezervasiyanı silmək istəyirsiniz? Bu əməliyyat geri alına bilməz.')) handleDelete(r.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Tables */}
        {editingTables && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-lg font-medium">{t('admin.editTablesTitle')}</h3>
                  {tablesLoading ? (
                    <div className="h-[400px] w-full rounded-xl bg-stone-900 flex items-center justify-center">
                      <p className="text-white">Yüklənir...</p>
                    </div>
                  ) : (
                    <Suspense fallback={<div className="h-[400px] w-full rounded-xl bg-stone-900" />}>
                      <TableSelection3D
                        selectedTable={selectedAdminTable}
                        onTableSelect={num => setSelectedAdminTable(num)}
                        partySize={1}
                        tables={adminTables.map(t =>
                          reservedTableNumbers.includes(t.number) ? { ...t, isAvailable: false } : t
                        )}
                        onTablesChange={handleTablesChange}
                        editable
                        disableDrag
                        keyboardMove
                      />
                    </Suspense>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-lg font-medium">{t('admin.tableParameters')}</h3>

                  {!selectedAdminTable ? (
                    <p className="text-sm text-muted-foreground">{t('admin.selectTableFrom3D')}</p>
                  ) : (() => {
                    const table = adminTables.find(t => t.number === selectedAdminTable);
                    if (!table) return <p className="text-sm text-muted-foreground">{t('admin.tableNotFound')}</p>;

                    const update = (patch: Partial<TableData>) => {
                      const next = adminTables.map(t => t.number === table.number ? { ...t, ...patch } : t);
                      setAdminTables(next);
                      savePositionMap(next);
                    };

                    return (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs">{t('admin.tableNumber')}</label>
                          <Input value={String(table.number)} onChange={e => update({ number: Number(e.target.value) })} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs">{t('admin.seatsCount')}</label>
                          <Input type="number" min="1" max="12" value={String(table.seats)}
                            onChange={e => update({ seats: Number(e.target.value) })} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input id="avail" type="checkbox" checked={table.isAvailable}
                            onChange={e => update({ isAvailable: e.target.checked })} />
                          <label htmlFor="avail" className="text-sm">{t('admin.available')}</label>
                        </div>

                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Masanı köçür</p>
                          <div className="text-xs text-muted-foreground">
                            X={table.position[0].toFixed(2)} | Z={table.position[2].toFixed(2)}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <Button size="icon" onClick={() => moveTable(0, -MOVE_STEP)}>↑</Button>
                            <div className="flex gap-2">
                              <Button size="icon" onClick={() => moveTable(-MOVE_STEP, 0)}>←</Button>
                              <Button size="icon" onClick={() => moveTable(MOVE_STEP, 0)}>→</Button>
                            </div>
                            <Button size="icon" onClick={() => moveTable(0, MOVE_STEP)}>↓</Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Klaviatura oxlarını da istifadə edə bilərsiniz.</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button onClick={() => handleSaveTable(table)}>{t('common.save')}</Button>
                          <Button variant="destructive" onClick={() => handleDeleteTable(table)}>{t('common.delete')}</Button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6">
                    <Button onClick={handleAddTable}>{t('admin.addNewTable')}</Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Yeni stol platformanın mərkəzində yaranır. Ox düymələri ilə köçürün.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReservationsPage;