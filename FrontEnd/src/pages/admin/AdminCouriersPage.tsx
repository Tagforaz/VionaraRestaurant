import { useEffect, useState, useRef } from 'react';
import * as courierApi from '@/api/dev/courierDev';
import type { GetCourierListItemDto, GetCourierDto, PutCourierDto } from '@/api/dev/courierDev';
import { Bike, Search, Edit2, Trash2, Eye, Car, Loader2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CourierMap } from '@/components/CourierMap';

const COURIER_STATUS_LABELS: Record<number, string> = {
  1: 'Mövcud',
  2: 'Məşğul',
  3: 'Oflayn',
};

const getStatusBadgeVariant = (status: number): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 1: return 'default';
    case 2: return 'secondary';
    case 3: return 'outline';
    default: return 'outline';
  }
};

export default function AdminCouriersPage() {
  const { toast } = useToast();

  const [couriers, setCouriers] = useState<GetCourierListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<GetCourierDto | null>(null);
  const [viewingCourierDetails, setViewingCourierDetails] = useState<GetCourierDto | null>(null);
  const [courierToDelete, setCourierToDelete] = useState<{ id: string; soft: boolean } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCouriers();

    pollingRef.current = setInterval(() => {
      fetchCouriers(true);
    }, 20000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchCouriers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await courierApi.getCouriers(1, 50);
      const couriersData = Array.isArray(result) ? result : (result as any).data;
      setCouriers(couriersData || []);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to fetch couriers:', error);
      if (!silent) {
        toast({
          title: 'Xəta',
          description: 'Kuryerlər yüklənərkən xəta baş verdi',
          variant: 'destructive',
        });
      }
      if (!silent) setCouriers([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredCouriers = (couriers || []).filter((courier) => {
    const matchesSearch =
      (courier.userFullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (courier.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || courier.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVehicleIcon = (vehicle: number) => {
    if (vehicle === 4) return <Car className="h-4 w-4" />;
    return <Bike className="h-4 w-4" />;
  };

  const handleEditCourier = async (courier: GetCourierListItemDto) => {
    try {
      const fullCourier = await courierApi.getCourier(courier.id);
      setSelectedCourier(fullCourier);
      setImageFile(null);
      setImagePreview(null);
      setIsEditDialogOpen(true);
    } catch (error: any) {
      toast({ title: 'Xəta', description: 'Kuryer məlumatları yüklənərkən xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCourier) return;
    try {
      const putDto: PutCourierDto = {
        vehicleType: selectedCourier.vehicleType,
        status: selectedCourier.status,
        isAvailable: selectedCourier.isAvailable,
        imageFile: imageFile || undefined,
      };
      await courierApi.updateCourier(selectedCourier.id, putDto);
      toast({ title: 'Uğurlu', description: 'Kuryer uğurla yeniləndi' });
      setIsEditDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setSelectedCourier(null);
      fetchCouriers();
    } catch (error: any) {
      let errorMessage = error.response?.data?.title || 'Kuryer yenilənərkən xəta baş verdi';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(k => `${k}: ${errors[k].join(', ')}`).join('\n') || errorMessage;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({ title: 'Xəta', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDeleteCourier = (courierId: string) => {
    setCourierToDelete({ id: courierId, soft: false });
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteCourier = async () => {
    if (!courierToDelete) return;
    try {
      await courierApi.deleteCourier(courierToDelete.id);
      toast({ title: 'Uğurlu', description: 'Kuryer silindi' });
      setIsDeleteAlertOpen(false);
      setCourierToDelete(null);
      fetchCouriers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.title || error.message || 'Xəta baş verdi';
      toast({ title: 'Xəta', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleViewCourier = async (courierId: string) => {
    try {
      const fullCourier = await courierApi.getCourier(courierId);
      setViewingCourierDetails(fullCourier);
    } catch {
      toast({ title: 'Xəta', description: 'Kuryer məlumatları yüklənərkən xəta baş verdi', variant: 'destructive' });
    }
  };

  const stats = {
    total: couriers.length,
    available: couriers.filter(c => c.status === 1).length,
    busy: couriers.filter(c => c.status === 2).length,
    offline: couriers.filter(c => c.status === 3).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bike className="h-8 w-8" />
              Kuryer Paneli
            </h1>
            <p className="text-muted-foreground mt-1">Çatdırılma idarəçiliyi və kuryer məlumatlarının redaktəsi</p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              💡 <span>Yeni kuryer əlavə etmək üçün <strong>İşçi İdarəetməsi</strong> bölməsinə keçin</span>
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {lastUpdated && (
              <span>Son yenilənmə: {lastUpdated.toLocaleTimeString('az-AZ')}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchCouriers()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Yenilə
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Cəmi Kuryerlər', value: stats.total, icon: <Bike className="h-4 w-4 text-muted-foreground" />, dot: null },
            { label: 'Mövcud', value: stats.available, icon: null, dot: 'bg-green-500' },
            { label: 'Məşğul', value: stats.busy, icon: null, dot: 'bg-yellow-500' },
            { label: 'Oflayn', value: stats.offline, icon: null, dot: 'bg-gray-500' },
          ].map((card, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                {card.icon || (card.dot && <div className={`h-2 w-2 rounded-full ${card.dot}`} />)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CourierMap />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Kuryer axtarışı..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status filteri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              <SelectItem value="1">Mövcud</SelectItem>
              <SelectItem value="2">Məşğul</SelectItem>
              <SelectItem value="3">Oflayn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Couriers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kuryerlər Siyahısı</CardTitle>
            <CardDescription>Bütün kuryer əməkdaşlarının idarə olunması • Hər 20 saniyədə avtomatik yenilənir</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kuryer</TableHead>
                  <TableHead>Nəqliyyat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mövcudluq</TableHead>
                  <TableHead className="text-right">Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Yüklənir...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCouriers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Kuryer tapılmadı</TableCell>
                  </TableRow>
                ) : filteredCouriers.map(courier => (
                  <TableRow key={courier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {courier.imageUrl && <AvatarImage src={courier.imageUrl} alt={courier.userFullName} className="object-cover" />}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {courier.userFullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'K'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{courier.userFullName || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(courier.vehicleType || 1)}
                        <span className="text-sm font-medium">{courierApi.getVehicleTypeLabel(courier.vehicleType || 1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(courier.status)}>
                        {COURIER_STATUS_LABELS[courier.status] ?? 'Naməlum'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={courier.isAvailable ? 'default' : 'secondary'}>
                        {courier.isAvailable ? 'Mövcud' : 'Məşğul'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewCourier(courier.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditCourier(courier)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCourier(courier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={open => { setIsEditDialogOpen(open); if (!open) { setImageFile(null); setImagePreview(null); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kuryer Redaktə Et</DialogTitle>
              <DialogDescription>Kuryer məlumatlarını yeniləyin</DialogDescription>
            </DialogHeader>
            {selectedCourier && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nəqliyyat Növü</Label>
                  <Select value={selectedCourier.vehicleType.toString()} onValueChange={v => setSelectedCourier({ ...selectedCourier, vehicleType: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Velosiped</SelectItem>
                      <SelectItem value="2">Skuter</SelectItem>
                      <SelectItem value="3">Motosiklet</SelectItem>
                      <SelectItem value="4">Avtomobil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedCourier.status.toString()} onValueChange={v => setSelectedCourier({ ...selectedCourier, status: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Mövcud</SelectItem>
                      <SelectItem value="2">Məşğul</SelectItem>
                      <SelectItem value="3">Oflayn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mövcudluq</Label>
                  <Select value={selectedCourier.isAvailable ? 'true' : 'false'} onValueChange={v => setSelectedCourier({ ...selectedCourier, isAvailable: v === 'true' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Mövcud</SelectItem>
                      <SelectItem value="false">Məşğul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Şəkil</Label>
                  <Input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {(imagePreview || selectedCourier.imageUrl) && (
                    <img src={imagePreview || selectedCourier.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded border-2 border-gray-200 mt-2" />
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Ləğv et</Button>
              <Button onClick={handleSaveEdit}>Yadda saxla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kuryeri Arxivləşdir</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3 text-sm">
                  <p>Kuryer arxivləşdiriləcək və sistemdən gizlənəcək.</p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-semibold mb-1">Əminsiniz?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      <li>İstifadəçi hesabı qalacaq</li>
                      <li>Tarixçə saxlanılacaq</li>
                      <li>Kuryer yeni sifariş ala bilməyəcək</li>
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCourier} className="bg-yellow-600 hover:bg-yellow-700">Arxivləşdir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Dialog */}
        <Dialog open={!!viewingCourierDetails} onOpenChange={open => !open && setViewingCourierDetails(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kuryer Detalları</DialogTitle>
              <DialogDescription>Kuryer haqqında tam məlumat</DialogDescription>
            </DialogHeader>
            {viewingCourierDetails && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    {viewingCourierDetails.imageUrl && <AvatarImage src={viewingCourierDetails.imageUrl} alt={viewingCourierDetails.userFullName} className="object-cover" />}
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {viewingCourierDetails.userFullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'K'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{viewingCourierDetails.userFullName || 'N/A'}</h3>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                    <div><p className="text-xs text-muted-foreground mb-1">Email</p><p className="text-sm font-medium">{viewingCourierDetails.email}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Telefon</p><p className="text-sm font-medium">{viewingCourierDetails.phoneNumber || 'N/A'}</p></div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Nəqliyyat:</span>
                    <div className="flex items-center gap-2">
                      {getVehicleIcon(viewingCourierDetails.vehicleType)}
                      <span className="text-sm font-medium">{courierApi.getVehicleTypeLabel(viewingCourierDetails.vehicleType)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={getStatusBadgeVariant(viewingCourierDetails.status)}>
                      {COURIER_STATUS_LABELS[viewingCourierDetails.status] ?? 'Naməlum'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Mövcudluq:</span>
                    <Badge variant={viewingCourierDetails.isAvailable ? 'default' : 'secondary'}>
                      {viewingCourierDetails.isAvailable ? 'Mövcud' : 'Məşğul'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div><p className="text-xs text-muted-foreground mb-1">Tamamlanmış</p><p className="text-xl font-bold text-green-600">{viewingCourierDetails.completedDeliveries || 0}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Davam edən</p><p className="text-xl font-bold text-blue-600">{viewingCourierDetails.ongoingDeliveries || 0}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Cəmi</p><p className="text-xl font-bold text-primary">{viewingCourierDetails.totalDeliveries || 0}</p></div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Son çatdırılma:</span>
                    <span className="text-sm font-medium">
                      {viewingCourierDetails.lastDeliveryDate ? new Date(viewingCourierDetails.lastDeliveryDate).toLocaleDateString('az-AZ') : 'Məlumat yoxdur'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Qeydiyyat tarixi:</span>
                    <span className="text-sm font-medium">{new Date(viewingCourierDetails.createdAt).toLocaleDateString('az-AZ')}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingCourierDetails(null)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
