import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Search, Mail, Calendar, Shield, Loader2, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/layouts';
import { useToast } from '@/hooks/use-toast';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  getRoleLabel,
  getRoleBadgeColor,
  type GetUserListDto,
  type BackendUserRole,
} from '@/api/dev/roleManagementDev';
import { restoreUser, getSoftDeletedUsers } from '@/api/dev/roleManagementDev';
import { hardDeleteUser } from '@/api/dev/roleManagementDev';

export const AdminRoleManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State management
  const [employees, setEmployees] = useState<GetUserListDto[]>([]);
  const [allEmployees, setAllEmployees] = useState<GetUserListDto[]>([]); // Keep full list for stats
  const [archivedEmployees, setArchivedEmployees] = useState<GetUserListDto[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<BackendUserRole | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<GetUserListDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 3 as BackendUserRole, // Chef (default)
  });

  // Dialog state for delete type
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, userId: string | null }>({ open: false, userId: null });
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Load employees from backend

  useEffect(() => {
    if (activeTab === 'active') {
      loadEmployees();
    } else {
      loadArchivedEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, searchQuery, activeTab]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (!result || !result.data) {
        throw new Error('Invalid response structure');
      }
      let filteredData = result.data.filter(u => u.role >= 3 && u.role <= 6);
      if (roleFilter !== 'all') {
        filteredData = filteredData.filter(u => u.role === roleFilter);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(u => 
          u.email.toLowerCase().includes(query) ||
          u.fullName.toLowerCase().includes(query)
        );
      }
      setEmployees(filteredData);
      setAllEmployees(result.data.filter(u => u.role >= 3 && u.role <= 6));
    } catch (error: any) {
      handleLoadError(error, 'Əməkdaşları yükləmək alınmadı');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedEmployees = async () => {
    try {
      setArchivedLoading(true);
      const result = await getSoftDeletedUsers();
      if (!result || !result.data) {
        throw new Error('Invalid response structure');
      }
      let filteredData = result.data.filter(u => u.role >= 3 && u.role <= 6);
      if (roleFilter !== 'all') {
        filteredData = filteredData.filter(u => u.role === roleFilter);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(u => 
          u.email.toLowerCase().includes(query) ||
          u.fullName.toLowerCase().includes(query)
        );
      }
      setArchivedEmployees(filteredData);
    } catch (error: any) {
      handleLoadError(error, 'Arxivləşdirilmiş əməkdaşları yükləmək alınmadı');
    } finally {
      setArchivedLoading(false);
    }
  };

  // Helper for error handling
  const handleLoadError = (error: any, fallbackMsg: string) => {
    console.error(fallbackMsg, error);
    if (error.response?.status === 401) {
      toast({
        title: 'İcazə rədd edildi',
        description: 'Bu əməliyyat üçün admin hüququnuz yoxdur. Yenidən daxil olun.',
        variant: 'destructive',
      });
    } else if (error.response?.status === 500) {
      toast({
        title: 'Backend Xətası',
        description: 'Backend serverdə xəta baş verdi. Backend logs yoxlayın.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || fallbackMsg,
        variant: 'destructive',
      });
    }
  };

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddEmployee = async () => {
    try {
      setSubmitting(true);
      await createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        role: formData.role,
      });

      toast({
        title: t('common.success'),
        description: 'Əməkdaş uğurla əlavə edildi',
      });

      setIsAddDialogOpen(false);
      setFormData({ email: '', firstName: '', lastName: '', password: '', role: 3 });
      loadEmployees();
    } catch (error: any) {
      console.error('❌ Failed to add employee:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || error.response?.data?.title || 'Əməkdaş əlavə etmək alınmadı',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;

    try {
      setSubmitting(true);

      // Update user details - PutUserDto requires all fields
      await updateUser(editingEmployee.id, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password || 'TempPassword123!', // Backend ignores if empty
        role: formData.role,
        isActive: editingEmployee.isActive,
      });

      toast({
        title: t('common.success'),
        description: 'Əməkdaş uğurla yeniləndi',
      });

      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || 'Əməkdaşı yeniləmək alınmadı',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setDeleteDialog({ open: true, userId: id });
  };

  const confirmDeleteEmployee = async () => {
    if (!deleteDialog.userId) return;
    try {
      if (deleteType === 'soft') {
        await deleteUser(deleteDialog.userId);
        toast({
          title: t('common.success'),
          description: 'Əməkdaş arxivləşdirildi',
        });
      } else {
        await hardDeleteUser(deleteDialog.userId);
        toast({
          title: t('common.success'),
          description: 'Əməkdaş tam silindi',
        });
      }
      setDeleteDialog({ open: false, userId: null });
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || 'Əməkdaşı silmək alınmadı',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = async (employee: GetUserListDto) => {
    try {
      // Get full user details to get firstName and lastName
      const details = await getUserById(employee.id);
      setEditingEmployee({ ...employee, firstName: details.firstName, lastName: details.lastName } as any);
      setFormData({
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        password: '',
        role: details.role,
      });
      setIsEditDialogOpen(true);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: 'Əməkdaş məlumatlarını yükləmək alınmadı',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getRoleIcon = () => {
    return <Shield className="h-4 w-4" />;
  };

  const filteredEmployees = employees;
  const filteredArchivedEmployees = archivedEmployees;

  const roleStats = {
    chef: allEmployees.filter(e => e.role === 3).length,
    waiter: allEmployees.filter(e => e.role === 4).length,
    moderator: allEmployees.filter(e => e.role === 5).length,
    courier: allEmployees.filter(e => e.role === 6).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tabs for active/archived */}
        <div className="flex gap-2 mb-2">
          <Button variant={activeTab === 'active' ? 'default' : 'outline'} onClick={() => setActiveTab('active')}>
            Aktiv əməkdaşlar
          </Button>
          <Button variant={activeTab === 'archived' ? 'default' : 'outline'} onClick={() => setActiveTab('archived')}>
            Arxivləşdirilmiş əməkdaşlar
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.roleManagement')}</h1>
            <p className="text-muted-foreground">{t('admin.manageEmployeeRoles')}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.newEmployee')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.addNewEmployee')}</DialogTitle>
                <DialogDescription>
                  {t('admin.addEmployeeDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    disabled={submitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('common.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('common.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('common.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('common.role')}</Label>
                  <Select
                    value={formData.role.toString()}
                    onValueChange={(value) => setFormData({ ...formData, role: parseInt(value) as BackendUserRole })}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">{t('roles.chef')}</SelectItem>
                      <SelectItem value="4">{t('roles.waiter')}</SelectItem>
                      <SelectItem value="5">{t('roles.moderator')}</SelectItem>
                      <SelectItem value="6">{t('roles.courier')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={submitting}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddEmployee} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Stats */}
        <div className="grid gap-4 md:grid-cols-4">

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('roles.chefs')}</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{roleStats.chef}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.activeEmployees')}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('roles.waiters')}</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{roleStats.waiter}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.activeEmployees')}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('roles.moderators')}</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-4 w-4 text-green-600 dark:text-green-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{roleStats.moderator}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.activeEmployees')}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('roles.couriers')}</CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Users className="h-4 w-4 text-amber-600 dark:text-amber-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{roleStats.courier}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.activeEmployees')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchEmployee')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Select 
            value={roleFilter === 'all' ? 'all' : roleFilter.toString()} 
            onValueChange={(value) => setRoleFilter(value === 'all' ? 'all' : parseInt(value) as BackendUserRole)}
            disabled={loading}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('admin.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allRoles')}</SelectItem>
              <SelectItem value="3">{t('roles.chef')}</SelectItem>
              <SelectItem value="4">{t('roles.waiter')}</SelectItem>
              <SelectItem value="5">{t('roles.moderator')}</SelectItem>
              <SelectItem value="6">{t('roles.courier')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employees Table (Active/Archived) */}
        {activeTab === 'active' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('admin.employeesList')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredEmployees.length} {t('admin.employeesFound')}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.employee')}</TableHead>
                      <TableHead>{t('admin.contact')}</TableHead>
                      <TableHead>{t('admin.role')}</TableHead>
                      <TableHead>{t('admin.registration')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {t('admin.noEmployeesFound')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(employee => (
                        <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${getRoleBadgeColor(employee.role)} font-semibold`}>
                                  {getInitials(employee.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {employee.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">{t('common.id')}: {employee.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{employee.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(employee.role)} variant="secondary">
                              {getRoleIcon()}
                              <span className="ml-1">{getRoleLabel(employee.role)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {(() => {
                                // Use lastLoginAt if createdAt is invalid or missing
                                const dateToShow = employee.lastLoginAt || employee.createdAt;
                                if (!dateToShow || dateToShow === '0001-01-01T00:00:00' || new Date(dateToShow).getFullYear() === 1) {
                                  return 'Məlumat yoxdur';
                                }
                                return new Date(dateToShow).toLocaleDateString('az-AZ');
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Arxivləşdirilmiş əməkdaşlar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredArchivedEmployees.length} əməkdaş tapıldı
              </p>
            </CardHeader>
            <CardContent>
              {archivedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.employee')}</TableHead>
                      <TableHead>{t('admin.contact')}</TableHead>
                      <TableHead>{t('admin.role')}</TableHead>
                      <TableHead>{t('admin.registration')}</TableHead>
                      <TableHead className="text-right">Bərpa et</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArchivedEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Heç bir arxivləşdirilmiş əməkdaş tapılmadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredArchivedEmployees.map(employee => (
                        <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${getRoleBadgeColor(employee.role)} font-semibold`}>
                                  {getInitials(employee.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {employee.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">{t('common.id')}: {employee.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{employee.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(employee.role)} variant="secondary">
                              {getRoleIcon()}
                              <span className="ml-1">{getRoleLabel(employee.role)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {(() => {
                                const dateToShow = employee.lastLoginAt || employee.createdAt;
                                if (!dateToShow || dateToShow === '0001-01-01T00:00:00' || new Date(dateToShow).getFullYear() === 1) {
                                  return 'Məlumat yoxdur';
                                }
                                return new Date(dateToShow).toLocaleDateString('az-AZ');
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await restoreUser(employee.id);
                                  toast({
                                    title: 'Bərpa olundu',
                                    description: 'Əməkdaş uğurla bərpa edildi',
                                  });
                                  loadArchivedEmployees();
                                  loadEmployees();
                                } catch (error: any) {
                                  toast({
                                    title: t('common.error'),
                                    description: error.response?.data?.message || 'Bərpa etmək alınmadı',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              Bərpa et
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.editEmployee')}</DialogTitle>
              <DialogDescription>
                {t('admin.editEmployeeDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('common.email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">{t('common.firstName')}</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">{t('common.lastName')}</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t('common.role')}</Label>
                <Select
                  value={formData.role.toString()}
                  onValueChange={(value) => setFormData({ ...formData, role: parseInt(value) as BackendUserRole })}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">{t('roles.chef')}</SelectItem>
                    <SelectItem value="4">{t('roles.waiter')}</SelectItem>
                    <SelectItem value="5">{t('roles.moderator')}</SelectItem>
                    <SelectItem value="6">{t('roles.courier')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleEditEmployee} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete type dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Əməkdaşı silmək</DialogTitle>
              <DialogDescription>Əməkdaşı necə silmək istəyirsiniz?</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <Button variant={deleteType === 'soft' ? 'default' : 'outline'} onClick={() => setDeleteType('soft')}>
                Arxivləşdir (Soft Delete)
              </Button>
              <Button variant={deleteType === 'hard' ? 'default' : 'outline'} onClick={() => setDeleteType('hard')}>
                Tam sil (Hard Delete)
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={confirmDeleteEmployee} variant="destructive">Təsdiqlə</Button>
              <Button onClick={() => setDeleteDialog({ open: false, userId: null })} variant="outline">Ləğv et</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
