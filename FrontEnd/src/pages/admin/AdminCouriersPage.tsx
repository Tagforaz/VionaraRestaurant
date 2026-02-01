import { useState } from 'react';
import { Bike, Plus, Search, MapPin, Phone, Mail, Star, TrendingUp } from 'lucide-react';
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

// Demo data
const DEMO_COURIERS: Courier[] = [
  {
    id: '1',
    userId: 'user1',
    firstName: 'Elvin',
    lastName: 'Məmmədov',
    email: 'elvin@courier.com',
    phone: '+994 50 123 45 67',
    vehicleType: 'motorcycle',
    vehicleNumber: '10-AA-123',
    status: 'available',
    rating: 4.8,
    totalDeliveries: 234,
    activeDeliveries: 0,
    isActive: true,
    currentLocation: {
      latitude: 40.4093,
      longitude: 49.8671,
      lastUpdated: new Date().toISOString(),
    },
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    userId: 'user2',
    firstName: 'Nigar',
    lastName: 'Əliyeva',
    email: 'nigar@courier.com',
    phone: '+994 51 234 56 78',
    vehicleType: 'scooter',
    vehicleNumber: '90-BB-456',
    status: 'busy',
    rating: 4.9,
    totalDeliveries: 312,
    activeDeliveries: 2,
    isActive: true,
    currentLocation: {
      latitude: 40.3777,
      longitude: 49.8920,
      lastUpdated: new Date().toISOString(),
    },
    createdAt: '2023-11-20T10:00:00Z',
  },
  {
    id: '3',
    userId: 'user3',
    firstName: 'Rəşad',
    lastName: 'Həsənov',
    email: 'rashad@courier.com',
    phone: '+994 55 345 67 89',
    vehicleType: 'bike',
    vehicleNumber: '77-CC-789',
    status: 'offline',
    rating: 4.6,
    totalDeliveries: 156,
    activeDeliveries: 0,
    isActive: true,
    createdAt: '2024-03-10T10:00:00Z',
  },
];

export default function AdminCouriersPage() {
  const { t } = useTranslation();
  const [couriers, setCouriers] = useState<Courier[]>(DEMO_COURIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourierStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCourier, setNewCourier] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: 'motorcycle' as const,
    vehicleNumber: '',
  });

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

  const handleAddCourier = () => {
    const courier: Courier = {
      id: String(couriers.length + 1),
      userId: `user${couriers.length + 1}`,
      ...newCourier,
      status: 'offline',
      rating: 5.0,
      totalDeliveries: 0,
      activeDeliveries: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setCouriers([...couriers, courier]);
    setIsAddDialogOpen(false);
    setNewCourier({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      vehicleType: 'motorcycle',
      vehicleNumber: '',
    });
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
              {t('admin.couriers.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.couriers.description')}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('courier.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={newCourier.firstName}
                      onChange={(e) =>
                        setNewCourier({ ...newCourier, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('courier.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={newCourier.lastName}
                      onChange={(e) =>
                        setNewCourier({ ...newCourier, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('courier.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCourier.email}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('courier.phone')}</Label>
                  <Input
                    id="phone"
                    value={newCourier.phone}
                    onChange={(e) =>
                      setNewCourier({ ...newCourier, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">{t('courier.vehicleNumber')}</Label>
                    <Input
                      id="vehicleNumber"
                      value={newCourier.vehicleNumber}
                      onChange={(e) =>
                        setNewCourier({ ...newCourier, vehicleNumber: e.target.value })
                      }
                    />
                  </div>
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
        <div className="grid gap-4 md:grid-cols-5">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('courier.stats.avgRating')}
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRating}</div>
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
                      <Button variant="ghost" size="sm">
                        {t('admin.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
