import { useEffect, useState } from 'react';
import * as courierApi from '@/api/dev/courierDev';
import type { GetCourierDto, PostCourierDto, PutCourierDto, VehicleType, CourierStatus } from '@/api/dev/courierDev';
import { Bike, Plus, Search, Star, TrendingUp, Edit2, Trash2, Eye, Car } from 'lucide-react';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<GetCourierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourierStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<GetCourierDto | null>(null);
  const [courierToDelete, setCourierToDelete] = useState<{ id: string, soft: boolean } | null>(null);
  const [viewingCourier, setViewingCourier] = useState<GetCourierDto | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newCourier, setNewCourier] = useState<PostCourierDto>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    vehicleType: 'Motorcycle' as VehicleType,
  });

  // Fetch couriers from API
  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await courierApi.getCouriers();
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setCouriers(data);
    } catch (error: any) {
      console.error('Failed to fetch couriers:', error);
      toast.error('Kuryerlər yüklənərkən xəta baş verdi');
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCouriers = couriers.filter((courier) => {
    try {
      const matchesSearch =
        (courier.userFullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (courier.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    } catch (err) {
      console.error('Error filtering courier:', courier, err);
      return false;
    }
  });

  const getStatusBadge = (status: CourierStatus) => {
    const variants: Record<CourierStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      'Pending': 'secondary',
      'Approved': 'outline',
      'Active': 'default',
      'Suspended': 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const getVehicleIcon = (vehicle: VehicleType) => {
    switch (vehicle) {
      case 'Bicycle':
        return <Bike className="h-4 w-4" />;
      case 'Motorcycle':
        return <Bike className="h-4 w-4" />;
      case 'Car':
        return <Car className="h-4 w-4" />;
      default:
        return <Bike className="h-4 w-4" />;
    }
  };

  const handleAddCourier = async () => {
    try {
      await courierApi.createCourier(newCourier, imageFile || undefined);
      toast.success('Kuryer uğurla əlavə edildi');
      setIsAddDialogOpen(false);
      setNewCourier({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        vehicleType: 'Motorcycle' as VehicleType,
      });
      setImageFile(null);
      setImagePreview(null);
      fetchCouriers();
    } catch (error: any) {
      console.error('Add courier error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title || 
                          error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
                          error.message || 
                          'Kuryer əlavə edərkən xəta baş verdi';
      toast.error(errorMessage);
    }
  };

  const handleEditCourier = (courier: GetCourierDto) => {
    setSelectedCourier(courier);
    setImageFile(null);
    setImagePreview(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (selectedCourier) {
      try {
        const putDto: PutCourierDto = {
          vehicleType: selectedCourier.vehicleType,
          status: selectedCourier.status,
          isAvailable: selectedCourier.isAvailable,
        };
        await courierApi.updateCourier(selectedCourier.id, putDto, imageFile || undefined);
        toast.success('Kuryer uğurla yeniləndi');
        setIsEditDialogOpen(false);
        setImageFile(null);
        setImagePreview(null);
        fetchCouriers();
      } catch (error: any) {
        console.error('Update courier error:', error.response?.data);
        console.error('Validation errors:', error.response?.data?.errors);
        
        let errorMessage = error.response?.data?.title || 'Kuryer yenilənərkən xəta baş verdi';
        
        // Extract specific validation errors
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
          errorMessage = errorMessages.join('\n') || errorMessage;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteCourier = (courierId: string) => {
    setCourierToDelete({ id: courierId, soft: true });
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteCourier = async () => {
    if (courierToDelete) {
      try {
        await courierApi.softDeleteCourier(courierToDelete.id);
        toast.success('Kuryer arxivləşdirildi');
        setIsDeleteAlertOpen(false);
        setCourierToDelete(null);
        fetchCouriers();
      } catch (error: any) {
        console.error('Delete courier error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.title ||
                            error.response?.data?.error || 
                            error.message || 
                            'Kuryer arxivləşdirilərkən xəta baş verdi';
        toast.error(errorMessage);
      }
    }
  };

  const stats = {
    total: couriers.length,
    active: couriers.filter((c) => c.status === 'Active').length,
    pending: couriers.filter((c) => c.status === 'Pending').length,
    suspended: couriers.filter((c) => c.status === 'Suspended').length,
    avgRating: couriers.length > 0 ? (couriers.reduce((sum, c) => sum + (c.averageRating || 0), 0) / couriers.length).toFixed(1) : '0',
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
            <p className="text-muted-foreground mt-1">
              Çatdırılma idarəçiliyi
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setImageFile(null);
              setImagePreview(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Kuryer Əlavə Et
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Kuryer Əlavə Et</DialogTitle>
                <DialogDescription>
                  Yeni kuryer üçün hesab yaradılacaq
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      value={newCourier.firstName}
                      onChange={(e) =>
                        setNewCourier({ ...newCourier, firstName: e.target.value })
                      }
                      placeholder="Ad daxil edin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      value={newCourier.lastName}
                      onChange={(e) =>
                        setNewCourier({ ...newCourier, lastName: e.target.value })
                      }
                      placeholder="Soyad daxil edin"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCourier.email}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefon *</Label>
                  <Input
                    id="phoneNumber"
                    value={newCourier.phoneNumber}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, phoneNumber: e.target.value })
                    }
                    placeholder="+994501234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifrə *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newCourier.password}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, password: e.target.value })
                    }
                    placeholder="Şifrə daxil edin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Nəqliyyat Növü *</Label>
                  <Select
                    value={newCourier.vehicleType}
                    onValueChange={(value: any) =>
                      setNewCourier({ ...newCourier, vehicleType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nəqliyyat növünü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bicycle">Velosiped</SelectItem>
                      <SelectItem value="Motorcycle">Motosiklet</SelectItem>
                      <SelectItem value="Car">Avtomobil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courierImage">Şəkil</Label>
                  <Input
                    id="courierImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Şəkil önizləməsi:</p>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded border-2 border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Ləğv et
                </Button>
                <Button onClick={handleAddCourier}>
                  Əlavə et
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cəmi Kuryerlər
              </CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktiv
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gözləyən
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Dayandırılıb
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kuryer axtarışı..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status filteri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              <SelectItem value="Pending">Gözləyən</SelectItem>
              <SelectItem value="Approved">Təsdiqlənmiş</SelectItem>
              <SelectItem value="Active">Aktiv</SelectItem>
              <SelectItem value="Suspended">Dayandırılıb</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Couriers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kuryerlər Siyahısı</CardTitle>
            <CardDescription>
              Bütün kuryer əməkdaşlarının idarə olunması
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kuryer</TableHead>
                  <TableHead>Nəqliyyat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Statistika</TableHead>
                  <TableHead>Mövcudluq</TableHead>
                  <TableHead className="text-right">Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={courier.imageUrl} />
                          <AvatarFallback>
                            {courier.userFullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {courier.userFullName || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {(courier.averageRating || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(courier.vehicleType)}
                        <div className="text-sm font-medium">
                          {courier.vehicleType === 'Bicycle' && 'Velosiped'}
                          {courier.vehicleType === 'Motorcycle' && 'Motosiklet'}
                          {courier.vehicleType === 'Car' && 'Avtomobil'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(courier.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{courier.completedDeliveries} çatdırılma</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={courier.isAvailable ? 'default' : 'secondary'}>
                        {courier.isAvailable ? 'Mövcud' : 'Məşğul'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setViewingCourier(courier)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditCourier(courier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCourier(courier.id)}
                        >
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

        {/* Edit Courier Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setImageFile(null);
            setImagePreview(null);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kuryer Redaktə Et</DialogTitle>
              <DialogDescription>
                Kuryer məlumatlarını yeniləyin
              </DialogDescription>
            </DialogHeader>
            {selectedCourier && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicleType">Nəqliyyat Növü</Label>
                  <Select
                    value={selectedCourier.vehicleType}
                    onValueChange={(value: any) =>
                      setSelectedCourier({ ...selectedCourier, vehicleType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bicycle">Velosiped</SelectItem>
                      <SelectItem value="Motorcycle">Motosiklet</SelectItem>
                      <SelectItem value="Car">Avtomobil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedCourier.status}
                    onValueChange={(value: any) =>
                      setSelectedCourier({ ...selectedCourier, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Gözləyən</SelectItem>
                      <SelectItem value="Approved">Təsdiqlənmiş</SelectItem>
                      <SelectItem value="Active">Aktiv</SelectItem>
                      <SelectItem value="Suspended">Dayandırılıb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-isAvailable">Mövcudluq</Label>
                  <Select
                    value={selectedCourier.isAvailable ? 'true' : 'false'}
                    onValueChange={(value) =>
                      setSelectedCourier({ ...selectedCourier, isAvailable: value === 'true' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Mövcud</SelectItem>
                      <SelectItem value="false">Məşğul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">Şəkil</Label>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {(imagePreview || selectedCourier.imageUrl) && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Şəkil önizləməsi:</p>
                      <img 
                        src={imagePreview || selectedCourier.imageUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded border-2 border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Ləğv et
              </Button>
              <Button onClick={handleSaveEdit}>
                Yadda saxla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kuryeri Arxivləşdir</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3 text-sm">
                  <p>
                    Kuryer arxivləşdiriləcək və sistemdən gizlənəcək.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-semibold mb-1">Əminsiniz?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      <li>İstifadəçi hesabı qalacaq</li>
                      <li>Tarixçə və sifarish məlumatları saxlanılacaq</li>
                      <li>Kuryer yeni sifarish ala bilməyəcək</li>
                    </ul>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    <strong>Qeyd:</strong> Hard delete database strukturuna görə mümkün deyil.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteCourier}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Arxivləşdir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Courier Details Dialog */}
        <Dialog open={!!viewingCourier} onOpenChange={(open) => !open && setViewingCourier(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kuryer Detalları</DialogTitle>
              <DialogDescription>
                Kuryer haqqında tam məlumat
              </DialogDescription>
            </DialogHeader>
            {viewingCourier && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={viewingCourier.imageUrl} />
                    <AvatarFallback>
                      {viewingCourier.userFullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{viewingCourier.userFullName || 'N/A'}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {(viewingCourier.averageRating || 0).toFixed(1)} reytinq
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">İstifadəçi ID</p>
                      <p className="text-sm font-medium">{viewingCourier.userId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Kuryer ID</p>
                      <p className="text-sm font-medium">{viewingCourier.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Nəqliyyat növü:</span>
                    <div className="flex items-center gap-2">
                      {getVehicleIcon(viewingCourier.vehicleType)}
                      <span className="text-sm font-medium">
                        {viewingCourier.vehicleType === 'Bicycle' && 'Velosiped'}
                        {viewingCourier.vehicleType === 'Motorcycle' && 'Motosiklet'}
                        {viewingCourier.vehicleType === 'Car' && 'Avtomobil'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(viewingCourier.status)}
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Mövcudluq:</span>
                    <Badge variant={viewingCourier.isAvailable ? 'default' : 'secondary'}>
                      {viewingCourier.isAvailable ? 'Mövcud' : 'Məşğul'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tamamlanmış çatdırılmalar</p>
                      <p className="text-xl font-bold text-primary">{viewingCourier.completedDeliveries || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ortalama reytinq</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <p className="text-xl font-bold">{(viewingCourier.averageRating || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Qeydiyyat tarixi:</span>
                    <span className="text-sm font-medium">
                      {new Date(viewingCourier.createdAt).toLocaleDateString('az-AZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingCourier(null)}>
                Bağla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
