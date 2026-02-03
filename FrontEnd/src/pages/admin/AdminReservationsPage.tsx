import { useState, lazy, Suspense, useEffect, useRef } from 'react';
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

// Demo data
const demoReservations = [
  { id: 'RES-001', customer: 'John Doe', phone: '+1234567890', date: '2024-01-20', time: '19:00', guests: 4, status: 'pending' },
  { id: 'RES-002', customer: 'Jane Smith', phone: '+1234567891', date: '2024-01-20', time: '20:00', guests: 2, status: 'confirmed' },
  { id: 'RES-003', customer: 'Bob Wilson', phone: '+1234567892', date: '2024-01-21', time: '18:30', guests: 6, status: 'confirmed' },
  { id: 'RES-004', customer: 'Alice Brown', phone: '+1234567893', date: '2024-01-21', time: '19:30', guests: 3, status: 'cancelled' },
  { id: 'RES-005', customer: 'Charlie Davis', phone: '+1234567894', date: '2024-01-22', time: '20:30', guests: 8, status: 'pending' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const AdminReservationsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTables, setEditingTables] = useState(false);
  const [adminTables, setAdminTables] = useState<TableData[] | undefined>(undefined);
  const [selectedAdminTable, setSelectedAdminTable] = useState<number | null>(null);
  const [reservations, setReservations] = useState(demoReservations);
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
    
    const pendingReservations = demoReservations.filter(r => r.status === 'pending');
    previousPendingCountRef.current = pendingReservations.length;
  }, []);

  // Poll for new pending reservations
  useEffect(() => {
    const checkForPendingReservations = () => {
      const pendingReservations = reservations.filter(r => r.status === 'pending');
      const currentPendingCount = pendingReservations.length;

      if (currentPendingCount > previousPendingCountRef.current) {
        const newCount = currentPendingCount - previousPendingCountRef.current;
        const latest = pendingReservations[0];

        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        toast(t('admin.newReservation'), {
          description: `${latest.customer} - ${latest.date} ${latest.time}`,
        });

        if (notificationPermission === 'granted') {
          new Notification(t('admin.newReservation'), {
            body: `${latest.customer} - ${latest.date} ${latest.time}`,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
        }
      }

      previousPendingCountRef.current = currentPendingCount;
    };

    const interval = setInterval(checkForPendingReservations, 5000);
    return () => clearInterval(interval);
  }, [reservations, notificationPermission, t]);

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              <SelectItem value="pending">{t('admin.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('admin.confirmed')}</SelectItem>
              <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
              <SelectItem value="completed">{t('admin.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.id')}</TableHead>
                  <TableHead>{t('admin.customer')}</TableHead>
                  <TableHead>{t('admin.phone')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead>{t('admin.time')}</TableHead>
                  <TableHead>{t('admin.guests')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.id}</TableCell>
                    <TableCell>{res.customer}</TableCell>
                    <TableCell>{res.phone}</TableCell>
                    <TableCell>{res.date}</TableCell>
                    <TableCell>{res.time}</TableCell>
                    <TableCell>{res.guests} {t('admin.guests')}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[res.status]}>
                        {t(`admin.${res.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {res.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600" title="Confirm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Cancel">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                      const table = adminTables?.find(t => t.number === selectedAdminTable);
                      if (!table) return <p className="text-sm text-muted-foreground">{t('admin.tableNotFound')}</p>;

                      const update = (patch: Partial<TableData>) => {
                        const next = (adminTables || []).map(t => t.number === table.number ? { ...t, ...patch } : t);
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

                          <div>
                            <label className="text-xs">{t('admin.positionX')}</label>
                            <Input type="number" value={String(table.position[0])} onChange={(e) => update({ position: [Number(e.target.value), table.position[1], table.position[2]] })} className="mt-1" />
                          </div>

                          <div>
                            <label className="text-xs">{t('admin.positionZ')}</label>
                            <Input type="number" value={String(table.position[2])} onChange={(e) => update({ position: [table.position[0], table.position[1], Number(e.target.value)] })} className="mt-1" />
                          </div>

                          <div className="flex items-center gap-2">
                            <input id="avail" type="checkbox" checked={table.isAvailable} onChange={(e) => update({ isAvailable: e.target.checked })} />
                            <label htmlFor="avail" className="text-sm">{t('admin.available')}</label>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => {
                              setAdminTables((prev) => prev ? prev.map(t => t.number === table.number ? table : t) : [table]);
                            }}>{t('common.save')}</Button>
                            <Button variant="destructive" onClick={() => {
                              if (!adminTables) return;
                              const next = adminTables.filter(t => t.number !== table.number);
                              setAdminTables(next);
                              setSelectedAdminTable(null);
                            }}>{t('common.delete')}</Button>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  <div className="mt-6">
                    <Button onClick={() => {
                      const nextId = Math.max(0, ...(adminTables || []).map(t => t.id)) + 1;
                      const nextNumber = Math.max(0, ...(adminTables || []).map(t => t.number)) + 1;
                      const newTable: TableData = { id: nextId, number: nextNumber, seats: 4, position: [0,0,0], isAvailable: true };
                      setAdminTables(prev => prev ? [...prev, newTable] : [newTable]);
                      setSelectedAdminTable(nextNumber);
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
