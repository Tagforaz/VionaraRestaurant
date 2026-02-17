import { useState, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
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

// Helper function to find available position for new table
function findAvailablePosition(existingTables: TableData[], newTableSeats: number = 4): [number, number, number] {
  const tableRadius = newTableSeats <= 2 ? 0.4 : newTableSeats <= 4 ? 0.55 : 0.7;
  const requiredSpace = (tableRadius + 0.4) * 2 + 0.5; // table radius + chair space + margin
  
  // Try positions in a grid pattern
  for (let z = -4; z <= 4; z += requiredSpace) {
    for (let x = -5; x <= 5; x += requiredSpace) {
      const testPos: [number, number, number] = [x, 0, z];
      
      // Check if this position is valid (within bounds and no collisions)
      let isValid = true;
      
      // Check bounds
      if (x - tableRadius - 0.4 < -5.5 || x + tableRadius + 0.4 > 5.5) continue;
      if (z - tableRadius - 0.4 < -5 || z + tableRadius + 0.4 > 5) continue;
      
      // Check collisions with existing tables
      for (const table of existingTables) {
        const otherRadius = table.seats <= 2 ? 0.4 : table.seats <= 4 ? 0.55 : 0.7;
        const minDistance = tableRadius + otherRadius + 0.7 + 0.3; // both radii + chairs + margin
        
        const dx = testPos[0] - table.position[0];
        const dz = testPos[2] - table.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < minDistance) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        return testPos;
      }
    }
  }
  
  // Fallback to center if no position found (shouldn't happen unless restaurant is full)
  return [0, 0, 0];
}

const AdminReservationsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTables, setEditingTables] = useState(false);
  const [adminTables, setAdminTables] = useState<TableData[]>([]);
  // YALNIZ BİR DƏFƏ təyin olunur:
  const [reservations, setReservations] = useState<GetReservationDto[]>([]);
  // Bütün state-lərdən və funksiyalardan sonra, renderin əvvəlində:
  const reservedTableNumbers = Array.isArray(reservations)
    ? reservations.filter(r => r && r.tableNumber != null && statusLabels[r.status] !== 'Cancelled')
        .map(r => r.tableNumber as number)
    : [];
  const [tableIdMap, setTableIdMap] = useState<Map<number, string>>(new Map()); // Map tableNumber to database ID
  const [selectedAdminTable, setSelectedAdminTable] = useState<number | null>(null);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRawReservations, setLastRawReservations] = useState<any>(null);
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

    const extractReservations = (res: any): GetReservationDto[] => {
      if (!res) return [];
      // If caller returned array directly
      if (Array.isArray(res)) return res;
      // Axios response with data array
      if (res.data && Array.isArray(res.data)) return res.data;
      // Common paged shapes
      if (res.data && Array.isArray(res.data.items)) return res.data.items;
      if (res.items && Array.isArray(res.items)) return res.items;
      if (res.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    };

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await reservationApi.getReservations();
        console.log('Reservations API response:', res);
        setLastRawReservations(res);
        const data = extractReservations(res);
        setReservations(data);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        // capture raw error body for debugging
        setLastRawReservations((err as any)?.response?.data || err);
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
        
        // Load saved positions from localStorage
        const savedPositions = localStorage.getItem('tablePositions');
        const positionMap = savedPositions ? JSON.parse(savedPositions) : {};
        console.log('📍 Loaded positions from localStorage:', positionMap);
        
        // Convert backend GetTableDto to TableData format for 3D component
        const idMap = new Map<number, string>();
        const convertedTables: TableData[] = [];
        
        for (let i = 0; i < data.length; i++) {
          const table = data[i] as GetTableDto;
          
          // Store mapping of tableNumber to database ID
          idMap.set(table.tableNumber, table.id);
          
          // Use saved position if available, otherwise find available position
          let position: [number, number, number];
          const savedPos = positionMap[String(table.tableNumber)];
          if (savedPos && Array.isArray(savedPos) && savedPos.length === 3) {
            position = savedPos as [number, number, number];
            console.log(`✅ Table ${table.tableNumber} using saved position:`, position);
          } else {
            // Use findAvailablePosition to ensure bounds and collision checking
            position = findAvailablePosition(convertedTables, table.capacity);
            console.log(`⚠️ Table ${table.tableNumber} using auto-generated position:`, position);
          }
          
          convertedTables.push({
            id: table.tableNumber, // Use tableNumber as ID for frontend 3D rendering
            number: table.tableNumber,
            seats: table.capacity,
            position,
            isAvailable: table.isAvailable
          });
        }
        setTableIdMap(idMap);
        setAdminTables(convertedTables);
        
        // Save all positions to localStorage (including newly generated ones)
        const updatedPositionMap: Record<string, [number, number, number]> = {};
        convertedTables.forEach(table => {
          updatedPositionMap[String(table.number)] = table.position;
        });
        localStorage.setItem('tablePositions', JSON.stringify(updatedPositionMap));
        console.log('💾 Initial save - all table positions:', updatedPositionMap);
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

  // Helper: refresh reservations (memoized to prevent unnecessary re-renders)
  const refreshReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      // reuse extractor from above
      // @ts-ignore - extractor defined in outer scope
      const data = (typeof extractReservations === 'function') ? (extractReservations(res)) : (Array.isArray(res) ? res : []);
      setLastRawReservations(res);
      setReservations(data);
    } catch (err) {
      console.error('Failed to refresh reservations:', err);
      setLastRawReservations((err as any)?.response?.data || err);
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers for reservation actions
  const handleConfirm = async (id: string, res: GetReservationDto) => {
    try {
      await reservationApi.updateReservation(id, {
        date: res.date,
        time: res.time,
        partySize: res.partySize,
        status: 2, // Confirmed (enum int)
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
        status: 3, // Cancelled (enum int)
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

  // Memoize onTablesChange to prevent render loop and save positions
  const handleTablesChange = useCallback((next: TableData[]) => {
    setAdminTables(next);
    
    // Save positions to localStorage (use string keys for consistency)
    const positionMap: Record<string, [number, number, number]> = {};
    next.forEach(table => {
      positionMap[String(table.number)] = table.position;
    });
    localStorage.setItem('tablePositions', JSON.stringify(positionMap));
    console.log('💾 Saved positions to localStorage:', positionMap);
  }, []);



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
                              title="Cancel"
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
                        {/* Delete düyməsi çıxarıldı, Cancel statusu ilə əvəz olundu */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Debug panel silindi: artıq ehtiyac yoxdur */}
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
                        tables={adminTables.map(t => reservedTableNumbers.includes(t.number)
                          ? { ...t, isAvailable: false }
                          : t
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
                                // Get the database ID from the map
                                const databaseId = tableIdMap.get(table.number);
                                if (!databaseId) {
                                  toast.error('Table ID not found');
                                  return;
                                }
                                // Convert to PutTableDto (backend doesn't store positions)
                                const putDto = {
                                  tableNumber: table.number,
                                  capacity: table.seats,
                                  isAvailable: table.isAvailable
                                };
                                await tableApi.updateTable(databaseId, putDto);
                                toast.success('Table updated successfully');
                                
                                // Save current positions before refetch
                                const currentPositions: Record<number, [number, number, number]> = {};
                                adminTables.forEach(t => {
                                  currentPositions[t.number] = t.position;
                                });
                                
                                // Refetch to get latest data
                                const res = await tableApi.getTables();
                                const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                                const idMap = new Map<number, string>();
                                const convertedTables: TableData[] = data.map((t: GetTableDto) => {
                                  idMap.set(t.tableNumber, t.id);
                                  // Use current position if available
                                  const position = currentPositions[t.tableNumber] || [0, 0, 0] as [number, number, number];
                                  return {
                                    id: t.tableNumber,
                                    number: t.tableNumber,
                                    seats: t.capacity,
                                    position,
                                    isAvailable: t.isAvailable
                                  };
                                });
                                setTableIdMap(idMap);
                                setAdminTables(convertedTables);
                              } catch (err) {
                                console.error('Failed to update table:', err);
                                toast.error('Failed to update table');
                              }
                            }}>{t('common.save')}</Button>
                            <Button variant="destructive" onClick={async () => {
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
                                
                                // Remove from localStorage
                                const savedPositions = localStorage.getItem('tablePositions');
                                if (savedPositions) {
                                  const positionMap = JSON.parse(savedPositions);
                                  delete positionMap[String(table.number)];
                                  localStorage.setItem('tablePositions', JSON.stringify(positionMap));
                                }
                                
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
                        
                        // Find available position for new table
                        const newTablePosition = findAvailablePosition(adminTables, 4);
                        
                        // Save current positions before refetch
                        const currentPositions: Record<number, [number, number, number]> = {};
                        adminTables.forEach(t => {
                          currentPositions[t.number] = t.position;
                        });
                        // Add new table position (in available spot)
                        currentPositions[nextNumber] = newTablePosition;
                        
                        // Refetch tables to get the new table with proper ID
                        const res = await tableApi.getTables();
                        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                        const idMap = new Map<number, string>();
                        const convertedTables: TableData[] = data.map((table: GetTableDto) => {
                          idMap.set(table.tableNumber, table.id);
                          // Use saved position if available
                          const position = currentPositions[table.tableNumber] || [0, 0, 0] as [number, number, number];
                          return {
                            id: table.tableNumber,
                            number: table.tableNumber,
                            seats: table.capacity,
                            position,
                            isAvailable: table.isAvailable
                          };
                        });
                        setTableIdMap(idMap);
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
