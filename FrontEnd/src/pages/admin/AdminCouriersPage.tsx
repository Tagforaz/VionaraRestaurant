import { useEffect, useState } from 'react';
import * as courierApi from '@/api/dev/courierDev';
import { Bike, Plus, Search, MapPin, Phone, Mail, Star, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Courier, CourierStatus } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CourierMap } from '@/components/CourierMap';

// Remove demo data, use state from API

export default function AdminCouriersPage() {
  const { t } = useTranslation();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourierStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [courierToDelete, setCourierToDelete] = useState<string | null>(null);
  const [newCourier, setNewCourier] = useState({
    userId: '',
    vehicleType: 'motorcycle',
  });

  // Fetch couriers from API
  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      const data = await courierApi.getCouriers();
      setCouriers(data);
    } catch (e) {
      // handle error
    }
  };

  const filteredCouriers = couriers.filter((courier) => {
    const matchesSearch =
      courier.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CourierStatus) => {
    const variants = {
      available: 'default',
      busy: 'secondary',
      offline: 'outline',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {t(`courier.status.${status}`)}
      </Badge>
    );
  };

  const getVehicleIcon = (vehicle: string) => {
    return <Bike className="h-4 w-4" />;
  };

  const handleAddCourier = async () => {
    try {
      await courierApi.createCourier(newCourier);
      setIsAddDialogOpen(false);
      setNewCourier({ userId: '', vehicleType: 'motorcycle' });
      fetchCouriers();
      toast({
        title: t('admin.couriers.courierAdded'),
        description: `Courier added`,
      });
    } catch (e) {
      // handle error
    }
  };

  const handleEditCourier = (courier: Courier) => {
    setSelectedCourier(courier);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (selectedCourier) {
      try {
        await courierApi.updateCourier(selectedCourier.id, selectedCourier);
        setIsEditDialogOpen(false);
        fetchCouriers();
        toast({
          title: t('admin.couriers.courierUpdated'),
          description: `Courier updated`,
        });
      } catch (e) {
        // handle error
      }
    }
  };

  const handleDeleteCourier = (courierId: string) => {
    setCourierToDelete(courierId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteCourier = async () => {
    if (courierToDelete) {
      try {
        await courierApi.deleteCourier(courierToDelete);
        setIsDeleteAlertOpen(false);
        fetchCouriers();
        toast({
          title: t('admin.couriers.courierDeleted'),
          description: `Courier deleted`,
          variant: 'destructive',
        });
        setCourierToDelete(null);
      } catch (e) {
        // handle error
      }
    }
  };

  const stats = {
    total: couriers.length,
    available: couriers.filter((c) => c.status === 'available').length,
    busy: couriers.filter((c) => c.status === 'busy').length,
    offline: couriers.filter((c) => c.status === 'offline').length,
    avgRating: (couriers.reduce((sum, c) => sum + c.rating, 0) / couriers.length).toFixed(1),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bike className="h-8 w-8" />
              {t('courier.panel')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('courier.manageDeliveries')}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.couriers.addCourier')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('admin.couriers.addNewCourier')}</DialogTitle>
                <DialogDescription>
                  {t('admin.couriers.addCourierDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={newCourier.userId}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, userId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">{t('courier.vehicleType')}</Label>
                  <Select
                    value={newCourier.vehicleType}
                    onValueChange={(value: any) =>
                      setNewCourier({ ...newCourier, vehicleType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bike">{t('courier.vehicleTypes.bike')}</SelectItem>
                      <SelectItem value="scooter">{t('courier.vehicleTypes.scooter')}</SelectItem>
                      <SelectItem value="motorcycle">{t('courier.vehicleTypes.motorcycle')}</SelectItem>
                      <SelectItem value="car">{t('courier.vehicleTypes.car')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddCourier}>
                  {t('common.add')}
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
                {t('courier.stats.total')}
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
                {t('courier.stats.available')}
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.available}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('courier.stats.busy')}
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.busy}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('courier.stats.offline')}
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offline}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.couriers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('courier.status.all')}</SelectItem>
              <SelectItem value="available">{t('courier.status.available')}</SelectItem>
              <SelectItem value="busy">{t('courier.status.busy')}</SelectItem>
              <SelectItem value="offline">{t('courier.status.offline')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Couriers Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.couriers.couriersList')}</CardTitle>
            <CardDescription>
              {t('admin.couriers.couriersListDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('courier.courier')}</TableHead>
                  <TableHead>{t('courier.contact')}</TableHead>
                  <TableHead>{t('courier.vehicle')}</TableHead>
                  <TableHead>{t('courier.status.label')}</TableHead>
                  <TableHead>{t('courier.stats.label')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={courier.profilePhoto} />
                          <AvatarFallback>
                            {courier.firstName[0]}
                            {courier.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {courier.firstName} {courier.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {courier.rating}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {courier.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {courier.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(courier.vehicleType)}
                        <div>
                          <div className="text-sm font-medium">
                            {t(`courier.vehicleTypes.${courier.vehicleType}`)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {courier.vehicleNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(courier.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{courier.totalDeliveries} {t('courier.deliveries')}</span>
                        </div>
                        {courier.activeDeliveries > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {courier.activeDeliveries} {t('courier.active')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCourier(courier)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          {t('admin.edit')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
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

        {/* Live Courier Map */}
        <CourierMap couriers={filteredCouriers} />

        {/* Edit Courier Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('admin.couriers.editCourier')}</DialogTitle>
              <DialogDescription>
                {t('admin.couriers.editCourierDescription')}
              </DialogDescription>
            </DialogHeader>
            {selectedCourier && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">{t('courier.firstName')}</Label>
                    <Input
                      id="edit-firstName"
                      value={selectedCourier.firstName}
                      onChange={(e) =>
                        setSelectedCourier({ ...selectedCourier, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">{t('courier.lastName')}</Label>
                    <Input
                      id="edit-lastName"
                      value={selectedCourier.lastName}
                      onChange={(e) =>
                        setSelectedCourier({ ...selectedCourier, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t('courier.email')}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedCourier.email}
                    onChange={(e) =>
                      setSelectedCourier({ ...selectedCourier, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('courier.phone')}</Label>
                  <Input
                    id="edit-phone"
                    value={selectedCourier.phone}
                    onChange={(e) =>
                      setSelectedCourier({ ...selectedCourier, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehicleType">{t('courier.vehicleType')}</Label>
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
                        <SelectItem value="bike">{t('courier.vehicleTypes.bike')}</SelectItem>
                        <SelectItem value="scooter">{t('courier.vehicleTypes.scooter')}</SelectItem>
                        <SelectItem value="motorcycle">{t('courier.vehicleTypes.motorcycle')}</SelectItem>
                        <SelectItem value="car">{t('courier.vehicleTypes.car')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehicleNumber">{t('courier.vehicleNumber')}</Label>
                    <Input
                      id="edit-vehicleNumber"
                      value={selectedCourier.vehicleNumber}
                      onChange={(e) =>
                        setSelectedCourier({ ...selectedCourier, vehicleNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t('courier.status.label')}</Label>
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
                      <SelectItem value="available">{t('courier.status.available')}</SelectItem>
                      <SelectItem value="busy">{t('courier.status.busy')}</SelectItem>
                      <SelectItem value="offline">{t('courier.status.offline')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveEdit}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.couriers.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.couriers.confirmDeleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCourier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
