import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { UserRole, Employee } from '@/types';
import { getRoleLabel } from '@/lib/rolePermissions';
import { Plus, Edit, Trash2, Users, Search, Mail, Calendar, Shield } from 'lucide-react';
import { AdminLayout } from '@/layouts';

type EmployeeRole = 'chef' | 'waiter' | 'moderator' | 'courier';

const mockEmployees: Employee[] = [
  {
    id: '3',
    email: 'chef@demo.com',
    firstName: 'Aşbaz',
    lastName: 'Əliyev',
    role: 'chef',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    assignedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: '4',
    email: 'waiter@demo.com',
    firstName: 'Ofisant',
    lastName: 'Məmmədov',
    role: 'waiter',
    isActive: true,
    createdAt: '2026-01-11T00:00:00.000Z',
    assignedAt: '2026-01-11T00:00:00.000Z',
  },
  {
    id: '5',
    email: 'moderator@demo.com',
    firstName: 'Moderator',
    lastName: 'Həsənov',
    role: 'moderator',
    isActive: true,
    createdAt: '2026-01-12T00:00:00.000Z',
    assignedAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: '6',
    email: 'courier@demo.com',
    firstName: 'Kuryer',
    lastName: 'Quliyev',
    role: 'courier',
    isActive: true,
    createdAt: '2026-01-13T00:00:00.000Z',
    assignedAt: '2026-01-13T00:00:00.000Z',
  },
];

export const AdminRoleManagement = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState(mockEmployees);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'all'>('all');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'waiter' as EmployeeRole,
  });

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      assignedBy: '2', // Admin ID
    };

    setEmployees([...employees, newEmployee]);
    setIsAddDialogOpen(false);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'waiter',
    });
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, isActive: !emp.isActive } : emp))
    );
  };

  const updateEmployeeRole = (id: string, newRole: EmployeeRole) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, role: newRole } : emp))
    );
  };

  const deleteEmployee = (id: string) => {
    if (confirm('İşçini silmək istədiyinizdən əminsiniz?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      password: '',
      role: employee.role as EmployeeRole,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditEmployee = () => {
    if (editingEmployee) {
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === editingEmployee.id
            ? { ...emp, email: formData.email, firstName: formData.firstName, lastName: formData.lastName, role: formData.role }
            : emp
        )
      );
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      chef: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      waiter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      moderator: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      courier: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      customer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[role] || colors.customer;
  };

  const getRoleIcon = (role: UserRole) => {
    const icons = {
      admin: Shield,
      chef: Users,
      waiter: Users,
      moderator: Users,
      courier: Users,
      customer: Users,
    };
    const Icon = icons[role] || Users;
    return <Icon className="h-4 w-4" />;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    chef: employees.filter(e => e.role === 'chef').length,
    waiter: employees.filter(e => e.role === 'waiter').length,
    moderator: employees.filter(e => e.role === 'moderator').length,
    courier: employees.filter(e => e.role === 'courier').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.roleManagement')}</h1>
            <p className="text-muted-foreground">{t('admin.manageEmployeeRoles')}</p>
          </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('common.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('common.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('common.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: EmployeeRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chef">{t('roles.chef')}</SelectItem>
                    <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
                    <SelectItem value="moderator">{t('roles.moderator')}</SelectItem>
                    <SelectItem value="courier">{t('roles.courier')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddEmployee}>{t('common.add')}</Button>
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
          />
        </div>
        <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('admin.filterByRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allRoles')}</SelectItem>
            <SelectItem value="chef">{t('roles.chef')}</SelectItem>
            <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
            <SelectItem value="moderator">{t('roles.moderator')}</SelectItem>
            <SelectItem value="courier">{t('roles.courier')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employees Table */}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.employee')}</TableHead>
                <TableHead>{t('admin.contact')}</TableHead>
                <TableHead>{t('admin.role')}</TableHead>
                <TableHead>{t('admin.status')}</TableHead>
                <TableHead>{t('admin.registration')}</TableHead>
                <TableHead className="text-right">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('admin.noEmployeesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map(employee => (
                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${getRoleColor(employee.role)} font-semibold`}>
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('common.id')}: {employee.id}</p>
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
                      <Badge className={getRoleColor(employee.role)} variant="secondary">
                        {getRoleIcon(employee.role)}
                        <span className="ml-1">{t(`roles.${employee.role}`)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ● {t('admin.active')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">● {t('admin.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(employee.createdAt).toLocaleDateString('az-AZ')}
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
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className={employee.isActive ? 'text-orange-600' : 'text-green-600'}
                        >
                          {employee.isActive ? t('admin.deactivate') : t('admin.activate')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmployee(employee.id)}
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
        </CardContent>
      </Card>

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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">{t('common.firstName')}</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">{t('common.lastName')}</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t('common.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={(value: EmployeeRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chef">{t('roles.chef')}</SelectItem>
                  <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
                  <SelectItem value="moderator">{t('roles.moderator')}</SelectItem>
                  <SelectItem value="courier">{t('roles.courier')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditEmployee}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};
