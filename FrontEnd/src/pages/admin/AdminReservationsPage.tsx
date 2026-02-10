import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import * as reservationApi from '@/api/dev/reservationDev';
import type { GetReservationDto, ReservationStatus } from '@/api/dev/reservationDev';
import * as tableApi from '@/api/dev/tableDev';
import type { GetTableDto } from '@/api/dev/tableDev';
import { Search, CheckCircle, XCircle, Calendar } from 'lucide-react';
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

const statusColors: Record<ReservationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-gray-100 text-gray-800',
};

const AdminReservationsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTables, setEditingTables] = useState(false);
  const [adminTables, setAdminTables] = useState<TableData[]>([]);
  const [selectedAdminTable, setSelectedAdminTable] = useState<number | null>(null);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [reservations, setReservations] = useState<GetReservationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Fetch reservations from API
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await reservationApi.getReservations();
        console.log('Reservations API response:', res);
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setReservations(data);
        const pendingReservations = data.filter((r: GetReservationDto) => r.status === 'Pending');
        previousPendingCountRef.current = pendingReservations.length;
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        toast.error('Failed to fetch reservations');
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();

    // Fetch tables from database
    const fetchTables = async () => {
      setTablesLoading(true);
      try {
        const res = await tableApi.getTables();
        console.log('Tables API response:', res);
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        // Convert backend GetTableDto to TableData format for 3D component
        // Note: Backend doesn't store 3D positions, we generate them for visualization
        const convertedTables: TableData[] = data.map((table: GetTableDto, index: number) => {
          // Generate positions based on table order (arrange in a grid)
          const row = Math.floor(index / 3);
          const col = index % 3;
          return {
            id: table.tableNumber, // Use tableNumber as ID for frontend
            number: table.tableNumber,
            seats: table.capacity,
            position: [col * 3, 0, row * 3] as [number, number, number],
            isAvailable: table.isAvailable
          };
        });
        setAdminTables(convertedTables);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
        toast.error('Failed to fetch tables');
        setAdminTables([]);
      } finally {
        setTablesLoading(false);
      }
    };
    fetchTables();
  }, []);

  // Helper: refresh reservations
  const refreshReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setReservations(data);
    } catch (err) {
      console.error('Failed to refresh reservations:', err);
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for reservation actions
  const handleConfirm = async (id: string, res: GetReservationDto) => {
    try {
      await reservationApi.updateReservation(id, {
        date: res.date,
        time: res.time,
        partySize: res.partySize,
        status: 'Confirmed' as ReservationStatus,
        specialRequests: res.specialRequests
      });
      toast.success('Reservation confirmed');
      refreshReservations();
    } catch (err) {
      console.error('Failed to confirm reservation:', err);
      toast.error('Failed to confirm reservation');
    }
  };
  const handleCancel = async (id: string, res: GetReservationDto) => {
    try {
      await reservationApi.updateReservation(id, {
        date: res.date,
        time: res.time,
        partySize: res.partySize,
        status: 'Cancelled' as ReservationStatus,
        specialRequests: res.specialRequests
      });
      toast.success('Reservation cancelled');
      refreshReservations();
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
      toast.error('Failed to cancel reservation');
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

  // Poll for new pending reservations
  useEffect(() => {
    const checkForPendingReservations = () => {
      try {
        const pendingReservations = reservations.filter(r => r.status === 'Pending');
        const currentPendingCount = pendingReservations.length;

        if (currentPendingCount > previousPendingCountRef.current && pendingReservations[0]) {
          const newCount = currentPendingCount - previousPendingCountRef.current;
          const latest = pendingReservations[0];

          if (audioRef.current) {
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
          }

          toast(t('admin.newReservation'), {
            description: `${latest.customerName} - ${latest.date} ${latest.time}`,
          });

          if (notificationPermission === 'granted') {
            new Notification(t('admin.newReservation'), {
              body: `${latest.customerName} - ${latest.date} ${latest.time}`,
              icon: '/favicon.ico',
              requireInteraction: true,
            });
          }
        }

        previousPendingCountRef.current = currentPendingCount;
      } catch (err) {
        console.error('Error checking pending reservations:', err);
      }
    };

    const interval = setInterval(checkForPendingReservations, 5000);
    return () => clearInterval(interval);
  }, [reservations, notificationPermission, t]);

  const filteredReservations = reservations.filter(res => {
    try {
      const matchesSearch = (res.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow><TableCell colSpan={9}>No reservations found.</TableCell></TableRow>
                ) : filteredReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.customerName}</TableCell>
                    <TableCell>{res.customerEmail}</TableCell>
                    <TableCell>{res.customerPhone}</TableCell>
                    <TableCell>{new Date(res.date).toLocaleDateString()}</TableCell>
                    <TableCell>{res.time}</TableCell>
                    <TableCell>{res.partySize}</TableCell>
                    <TableCell>{res.tableNumber ? `Table ${res.tableNumber}` : '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[res.status]}>
                        {res.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {res.status === 'Pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600" title="Confirm" onClick={() => handleConfirm(res.id, res)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Cancel" onClick={() => handleCancel(res.id, res)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive" title="Delete" onClick={() => handleDelete(res.id)}>
                          <span className="sr-only">Delete</span>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
                    <Suspense fallback={<div className="h-[400px] w-full rounded-xl bg-stone-900" /> }>
                      <TableSelection3D
                        selectedTable={selectedAdminTable}
                        onTableSelect={(num) => setSelectedAdminTable(num)}
                        partySize={1}
                        tables={adminTables}
                        onTablesChange={(next) => setAdminTables(next)}
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

                  {selectedAdminTable && (
                    (() => {
                      const table = adminTables.find(t => t.number === selectedAdminTable);
                      if (!table) return <p className="text-sm text-muted-foreground">{t('admin.tableNotFound')}</p>;

                      const update = (patch: Partial<TableData>) => {
                        const next = adminTables.map(t => t.number === table.number ? { ...t, ...patch } : t);
                        setAdminTables(next);
                      };

                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs">{t('admin.tableNumber')}</label>
                            <Input value={String(table.number)} onChange={(e) => update({ number: Number(e.target.value) })} className="mt-1" />
                          </div>

                          <div>
                            <label className="text-xs">{t('admin.seatsCount')}</label>
                            <Input 
                              type="number" 
                              min="1" 
                              max="12" 
                              value={String(table.seats)} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 1 && val <= 12) {
                                  update({ seats: val });
                                } else if (val > 12) {
                                  toast.error(t('admin.maxSeatsError'));
                                }
                              }} 
                              className="mt-1" 
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input id="avail" type="checkbox" checked={table.isAvailable} onChange={(e) => update({ isAvailable: e.target.checked })} />
                            <label htmlFor="avail" className="text-sm">{t('admin.available')}</label>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={async () => {
                              try {
                                // Find the original table ID from backend
                                const originalTable = adminTables.find(t => t.number === table.number);
                                if (!originalTable) {
                                  toast.error('Original table not found');
                                  return;
                                }
                                // Convert to PutTableDto (backend doesn't store positions)
                                const putDto = {
                                  tableNumber: table.number,
                                  capacity: table.seats,
                                  isAvailable: table.isAvailable
                                };
                                await tableApi.updateTable(String(originalTable.id), putDto);
                                toast.success('Table updated successfully');
                                // Refetch to get latest data
                                const res = await tableApi.getTables();
                                const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                                const convertedTables: TableData[] = data.map((t: GetTableDto, index: number) => {
                                  const row = Math.floor(index / 3);
                                  const col = index % 3;
                                  return {
                                    id: t.tableNumber,
                                    number: t.tableNumber,
                                    seats: t.capacity,
                                    position: [col * 3, 0, row * 3] as [number, number, number],
                                    isAvailable: t.isAvailable
                                  };
                                });
                                setAdminTables(convertedTables);
                              } catch (err) {
                                console.error('Failed to update table:', err);
                                toast.error('Failed to update table');
                              }
                            }}>{t('common.save')}</Button>
                            <Button variant="destructive" onClick={async () => {
                              try {
                                await tableApi.deleteTable(String(table.id));
                                const next = adminTables.filter(t => t.number !== table.number);
                                setAdminTables(next);
                                setSelectedAdminTable(null);
                                toast.success('Table deleted successfully');
                              } catch (err) {
                                console.error('Failed to delete table:', err);
                                toast.error('Failed to delete table');
                              }
                            }}>{t('common.delete')}</Button>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  <div className="mt-6">
                    <Button onClick={async () => {
                      try {
                        const nextNumber = Math.max(0, ...adminTables.map(t => t.number)) + 1;
                        // Create PostTableDto (backend doesn't store positions)
                        const postDto = {
                          tableNumber: nextNumber,
                          capacity: 4
                        };
                        const response = await tableApi.createTable(postDto);
                        console.log('Created table:', response);
                        // Refetch tables to get the new table with proper ID
                        const res = await tableApi.getTables();
                        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                        const convertedTables: TableData[] = data.map((table: GetTableDto, index: number) => {
                          const row = Math.floor(index / 3);
                          const col = index % 3;
                          return {
                            id: table.tableNumber,
                            number: table.tableNumber,
                            seats: table.capacity,
                            position: [col * 3, 0, row * 3] as [number, number, number],
                            isAvailable: table.isAvailable
                          };
                        });
                        setAdminTables(convertedTables);
                        setSelectedAdminTable(nextNumber);
                        toast.success('Table added successfully');
                      } catch (err) {
                        console.error('Failed to add table:', err);
                        toast.error('Failed to add table');
                      }
                    }}>{t('admin.addNewTable')}</Button>
                    <p className="mt-2 text-xs text-muted-foreground">{t('admin.tableOverlapNote')}</p>
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
