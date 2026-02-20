import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import * as reservationApi from '@/api/dev/reservationDev';
import type { GetReservationDto } from '@/api/dev/reservationDev';
import * as tableApi from '@/api/dev/tableDev';
import type { GetTableDto } from '@/api/dev/tableDev';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TableSelection3D, { TableData } from '@/components/TableSelection3D';
import { toast } from 'sonner';

// Backend status enum mapping (number/string)
const statusLabels: Record<number | string, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Cancelled',
  4: 'Completed',
  5: 'NoShow',
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
  NoShow: 'NoShow',
};
const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-gray-100 text-gray-800',
  NoShow: 'bg-orange-100 text-orange-800',
};

// Platform bounds (must match TableSelection3D) – stollar yalnız bu sahədə görünür
const PLATFORM_BOUNDS = { minX: -5.5, maxX: 5.5, minZ: -5, maxZ: 5 };
const PLATFORM_RANGE_X = PLATFORM_BOUNDS.maxX - PLATFORM_BOUNDS.minX; // 11
const PLATFORM_RANGE_Z = PLATFORM_BOUNDS.maxZ - PLATFORM_BOUNDS.minZ; // 10

/** Backend 0–100 koordinatını platforma (-5.5..5.5, -5..5) çevirir */
function backendToPlatformPosition(backendX: number, backendZ: number): [number, number, number] {
  const x = (Number(backendX ?? 0) / 100) * PLATFORM_RANGE_X + PLATFORM_BOUNDS.minX;
  const z = (Number(backendZ ?? 0) / 100) * PLATFORM_RANGE_Z + PLATFORM_BOUNDS.minZ;
  return [x, 0, z];
}

/** Platform koordinatını backend 0–100 (mənfi olmaz, 0–100) çevirir */
function platformToBackendPosition(platformX: number, platformZ: number): { positionX: number; positionY: number } {
  const positionX = Math.max(0, Math.min(100, ((Number(platformX) - PLATFORM_BOUNDS.minX) / PLATFORM_RANGE_X) * 100));
  const positionY = Math.max(0, Math.min(100, ((Number(platformZ) - PLATFORM_BOUNDS.minZ) / PLATFORM_RANGE_Z) * 100));
  return { positionX, positionY };
}

/** Backend-dan gələn koordinatı platforma daxilində saxlayır; uzaq/səhv dəyərləri düzəldir */
function clampPositionToPlatform(x: number, z: number): [number, number, number] {
  const clampedX = Math.max(PLATFORM_BOUNDS.minX, Math.min(PLATFORM_BOUNDS.maxX, Number(x) || 0));
  const clampedZ = Math.max(PLATFORM_BOUNDS.minZ, Math.min(PLATFORM_BOUNDS.maxZ, Number(z) || 0));
  return [clampedX, 0, clampedZ];
}

/** localStorage: tableNumber -> [x,y,z] */
function loadPositionMap(): Record<string, [number, number, number]> {
  try {
    const saved = localStorage.getItem('tablePositions');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
function savePositionMap(tables: TableData[]) {
  const positionMap: Record<string, [number, number, number]> = {};
  tables.forEach(t => {
    positionMap[String(t.number)] = t.position;
  });
  localStorage.setItem('tablePositions', JSON.stringify(positionMap));
}

/** extract reservations from different response shapes */
function extractReservations(res: any): GetReservationDto[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

const AdminReservationsPage = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTables, setEditingTables] = useState(false);

  const [adminTables, setAdminTables] = useState<TableData[]>([]);
  const [reservations, setReservations] = useState<GetReservationDto[]>([]);
  const [tableIdMap, setTableIdMap] = useState<Map<number, string>>(new Map());
  const [selectedAdminTable, setSelectedAdminTable] = useState<number | null>(null);

  const [tablesLoading, setTablesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRawReservations, setLastRawReservations] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const adminTablesRef = useRef<TableData[]>([]);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  useEffect(() => {
    adminTablesRef.current = adminTables;
  }, [adminTables]);

  // Reserved tables (not cancelled)
  const reservedTableNumbers = Array.isArray(reservations)
    ? reservations
        .filter(r => r && r.tableNumber != null && statusLabels[r.status] !== 'Cancelled')
        .map(r => r.tableNumber as number)
    : [];

  // Move step for arrows (adjust as you want)
  const MOVE_STEP = 0.5;

  // Move selected table with arrows (yalnız lokal state + localStorage; backend-ə yalnız "Yadda saxla" basanda gedir)
  const moveTable = useCallback(
    (dx: number, dz: number) => {
      if (!selectedAdminTable) return;

      const next = adminTables.map(t => {
        if (t.number !== selectedAdminTable) return t;
        return {
          ...t,
          position: [t.position[0] + dx, t.position[1], t.position[2] + dz] as [
            number,
            number,
            number
          ],
        };
      });

      setAdminTables(next);
      savePositionMap(next);
    },
    [adminTables, selectedAdminTable]
  );

  // Arrow keys on keyboard (optional: works when editingTables is open)
  useEffect(() => {
    if (!editingTables) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedAdminTable) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveTable(0, -MOVE_STEP);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveTable(0, MOVE_STEP);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveTable(-MOVE_STEP, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveTable(MOVE_STEP, 0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingTables, selectedAdminTable, moveTable]);

  useEffect(() => {
    // notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => setNotificationPermission(permission));
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // audio
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await reservationApi.getReservations();
        setLastRawReservations(res);
        setReservations(extractReservations(res));
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setLastRawReservations((err as any)?.response?.data || err);
        toast.error('Failed to fetch reservations');
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

const fetchTables = async () => {
  setTablesLoading(true);

  try {
    const res = await tableApi.getTables();

    const data: GetTableDto[] = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
      ? (res as any).data
      : [];

    const idMap = new Map<number, string>();
    const savedPositions = loadPositionMap();

    const mapped: TableData[] = data.map((raw: any) => {
      idMap.set(raw.tableNumber, raw.id);
      const fromBackend = backendToPlatformPosition(raw.positionX ?? 0, raw.positionY ?? 0);
      const position = savedPositions[String(raw.tableNumber)] ?? fromBackend;
      return {
        id: raw.tableNumber,
        number: raw.tableNumber,
        seats: raw.capacity,
        position,
        isAvailable: raw.isAvailable ?? true
      };
    });

    setTableIdMap(idMap);
    setAdminTables(mapped);

  } catch (err) {
    console.error("Fetch tables error:", err);
    setAdminTables([]);
  } finally {
    setTablesLoading(false);
  }
};

    fetchReservations();
    fetchTables();
  }, []);

  const refreshReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      setLastRawReservations(res);
      setReservations(extractReservations(res));
    } catch (err) {
      console.error('Failed to refresh reservations:', err);
      setLastRawReservations((err as any)?.response?.data || err);
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirm = async (id: string, res: GetReservationDto) => {
    try {
      await reservationApi.updateReservation(id, {
        date: res.date,
        time: res.time,
        partySize: res.partySize,
        status: 'Confirmed',
        specialRequests: res.specialRequests,
      });
      toast.success('Reservation confirmed');
      refreshReservations();
    } catch (err) {
      console.error('Failed to confirm reservation:', err);
      toast.error('Failed to confirm reservation');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reservationApi.deleteReservation(id);
      toast.success('Reservation deleted');
      refreshReservations();
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      toast.error('Failed to delete reservation');
    }
  };

  const handleTablesChange = useCallback((next: TableData[]) => {
    setAdminTables(next);
    savePositionMap(next);
  }, []);

  const filteredReservations = reservations.filter(res => {
    try {
      const matchesSearch =
        (res.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (res.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    } catch (err) {
      console.error('Error filtering reservation:', res, err);
      return false;
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.reservations')}</h1>
            <p className="text-muted-foreground">{t('admin.manageReservations')}</p>
          </div>
          <Button variant={editingTables ? 'destructive' : 'default'} onClick={() => setEditingTables(v => !v)}>
            {editingTables ? t('admin.confirmChanges') : t('admin.editTables')}
          </Button>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading...</TableCell>
                  </TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>No reservations found.</TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map(res => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.customerName}</TableCell>
                      <TableCell>{res.customerEmail}</TableCell>
                      <TableCell>{res.customerPhone}</TableCell>
                      <TableCell>{new Date(res.date).toLocaleDateString()}</TableCell>
                      <TableCell>{res.time}</TableCell>
                      <TableCell>{res.partySize}</TableCell>
                      <TableCell>{res.tableNumber ? `Table ${res.tableNumber}` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[statusLabels[res.status] ?? 'Pending']}>
                          {statusLabels[res.status] ?? res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(res.status === 'Pending' || res.status === 1) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                title="Approve"
                                onClick={() => {
                                  if (window.confirm('Əminsiniz ki, bu rezervasiyanı təsdiqləmək istəyirsiniz?')) {
                                    handleConfirm(res.id, res);
                                  }
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                title="Delete"
                                onClick={() => {
                                  if (window.confirm('Əminsiniz ki, bu rezervasiyanı silmək istəyirsiniz?')) {
                                    handleDelete(res.id);
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                      <p className="text-white">Loading tables...</p>
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

                  {!selectedAdminTable && (
                    <p className="text-sm text-muted-foreground">{t('admin.selectTableFrom3D')}</p>
                  )}

                  {selectedAdminTable && (() => {
                    const table = adminTables.find(t => t.number === selectedAdminTable);
                    if (!table) return <p className="text-sm text-muted-foreground">{t('admin.tableNotFound')}</p>;

                    const update = (patch: Partial<TableData>) => {
                      const next = adminTables.map(t => (t.number === table.number ? { ...t, ...patch } : t));
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
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={String(table.seats)}
                            onChange={e => update({ seats: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input id="avail" type="checkbox" checked={table.isAvailable} onChange={e => update({ isAvailable: e.target.checked })} />
                          <label htmlFor="avail" className="text-sm">{t('admin.available')}</label>
                        </div>

                        {/* Arrow Controls (buttons) */}
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Move Table</p>

                          <div className="text-xs text-muted-foreground">
                            Current: X={table.position[0].toFixed(2)} | Z={table.position[2].toFixed(2)}
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <Button size="icon" onClick={() => moveTable(0, -MOVE_STEP)}>↑</Button>

                            <div className="flex gap-2">
                              <Button size="icon" onClick={() => moveTable(-MOVE_STEP, 0)}>←</Button>
                              <Button size="icon" onClick={() => moveTable(MOVE_STEP, 0)}>→</Button>
                            </div>

                            <Button size="icon" onClick={() => moveTable(0, MOVE_STEP)}>↓</Button>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            You can also use keyboard arrows.
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={async () => {
                              try {
                                const tableNumber = Number(table.number);
                                const capacity = Number(table.seats) || 1;
                                if (!tableNumber || tableNumber < 1) {
                                  toast.error('Stol nömrəsi düzgün deyil');
                                  return;
                                }
                                if (capacity < 1) {
                                  toast.error('Oturaq sayı ən azı 1 olmalıdır');
                                  return;
                                }

                                const databaseId = tableIdMap.get(table.number);
                                if (!databaseId) {
                                  toast.error('Table ID not found');
                                  return;
                                }

                                // Platform koordinatlarını backend 0–100 (mənfi olmaz) çeviririk
                                const { positionX: posX, positionY: posZ } = platformToBackendPosition(table.position[0], table.position[2]);
                                const putDto = {
                                  tableNumber,
                                  capacity,
                                  isAvailable: table.isAvailable,
                                  positionX: posX,
                                  positionY: posZ,
                                  rotation: (table as any).rotation ?? 0,
                                };

                                await tableApi.updateTable(databaseId, putDto);

                                // Seçilmiş stolun mövqeyini dərhal localStorage-ə yazırıq (refetch-dən əvvəl)
                                const savedPositions = loadPositionMap();
                                savedPositions[String(table.number)] = table.position;
                                localStorage.setItem('tablePositions', JSON.stringify(savedPositions));

                                // refetch; mövqeləri ref + seçilmiş table.position-dan oxuyuruq
                                const res = await tableApi.getTables();
                                const data: GetTableDto[] = Array.isArray(res)
                                  ? res
                                  : Array.isArray((res as any)?.data)
                                  ? (res as any).data
                                  : [];

                                const latestTables = adminTablesRef.current;
                                const idMap = new Map<number, string>();
                                const converted: TableData[] = data.map(tt => {
                                  const num = Number(tt.tableNumber);
                                  idMap.set(num, tt.id);
                                  const currentTable = latestTables.find(t => t.number === num);
                                  const fromStorage = loadPositionMap()[String(num)];
                                  const position = currentTable?.position ?? fromStorage ?? backendToPlatformPosition(Number(tt.positionX) ?? 0, Number(tt.positionY) ?? 0);
                                  return {
                                    id: num,
                                    number: num,
                                    seats: tt.capacity,
                                    position,
                                    isAvailable: tt.isAvailable,
                                  };
                                });

                                setTableIdMap(idMap);
                                setAdminTables(converted);
                                savePositionMap(converted);
                                toast.success('Table updated successfully');
                              } catch (err: any) {
                                console.error('Failed to update table:', err);
                                const msg = err?.response?.data?.message
                                  ?? err?.response?.data?.title
                                  ?? (typeof err?.response?.data === 'string' ? err.response.data : null)
                                  ?? err?.message
                                  ?? 'Failed to update table';
                                toast.error(msg);
                              }
                            }}
                          >
                            {t('common.save')}
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={async () => {
                              try {
                                const databaseId = tableIdMap.get(table.number);
                                if (!databaseId) {
                                  toast.error('Table ID not found');
                                  return;
                                }

                                await tableApi.deleteTable(databaseId);

                                const next = adminTables.filter(t => t.number !== table.number);
                                setAdminTables(next);
                                setSelectedAdminTable(null);
                                savePositionMap(next);

                                toast.success('Table deleted successfully');
                              } catch (err) {
                                console.error('Failed to delete table:', err);
                                toast.error('Failed to delete table');
                              }
                            }}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add table */}
                  <div className="mt-6">
                    <Button
                      onClick={async () => {
                        try {
                          const nextNumber = Math.max(0, ...adminTables.map(t => t.number)) + 1;

                          // Yeni stol yaradırıq (position olmadan)
                          await tableApi.createTable({
                            tableNumber: nextNumber,
                            capacity: 4,
                          });

                          // Refetch edirik ki, backend-dən ID-ni alaq
                          const res = await tableApi.getTables();
                          const data: GetTableDto[] = Array.isArray(res)
                            ? res
                            : Array.isArray((res as any)?.data)
                            ? (res as any).data
                            : [];

                          const newTableFromBackend = data.find(t => t.tableNumber === nextNumber);
                          if (!newTableFromBackend) {
                            toast.error('Yeni stol tapılmadı');
                            return;
                          }

                          // Platform mərkəzi (0, 0) = backend 50, 50 (0–100 aralığı)
                          const { positionX: centerX, positionY: centerZ } = platformToBackendPosition(0, 0);
                          await tableApi.updateTable(newTableFromBackend.id, {
                            tableNumber: nextNumber,
                            capacity: 4,
                            isAvailable: true,
                            positionX: centerX,
                            positionY: centerZ,
                            rotation: 0,
                          });

                          // Yenidən refetch; mövcud stolların mövqelərini cari state-dən saxlayırıq
                          const res2 = await tableApi.getTables();
                          const data2: GetTableDto[] = Array.isArray(res2)
                            ? res2
                            : Array.isArray((res2 as any)?.data)
                            ? (res2 as any).data
                            : [];

                          const idMap = new Map<number, string>();
                          const prevTables = adminTables;
                          const converted: TableData[] = data2.map(tt => {
                            idMap.set(tt.tableNumber, tt.id);
                            const currentTable = prevTables.find(t => t.number === tt.tableNumber);
                            const position = currentTable
                              ? currentTable.position
                              : backendToPlatformPosition(tt.positionX ?? 0, tt.positionY ?? 0);
                            return {
                              id: tt.tableNumber,
                              number: tt.tableNumber,
                              seats: tt.capacity,
                              position,
                              isAvailable: tt.isAvailable,
                            };
                          });

                          setTableIdMap(idMap);
                          setAdminTables(converted);
                          savePositionMap(converted);
                          setSelectedAdminTable(nextNumber);

                          toast.success('Stol uğurla əlavə edildi. Ox düymələri ilə köçürə bilərsiniz.');
                        } catch (err) {
                          console.error('Failed to add table:', err);
                          toast.error('Stol əlavə edilmədi');
                        }
                      }}
                    >
                      {t('admin.addNewTable')}
                    </Button>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Yeni stol platformanın mərkəzində (0, 0) yaranır. Ox düymələri ilə istədiyiniz yerə köçürün.
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
