import { ShoppingBag, Calendar, Star, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', total: '$45.99', status: 'pending', time: '5 min ago' },
  { id: 'ORD-002', customer: 'Jane Smith', total: '$89.50', status: 'preparing', time: '12 min ago' },
  { id: 'ORD-003', customer: 'Bob Wilson', total: '$32.00', status: 'ready', time: '25 min ago' },
  { id: 'ORD-004', customer: 'Alice Brown', total: '$67.25', status: 'delivered', time: '1 hour ago' },
];

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const stats = [
    { label: t('admin.totalOrders'), value: '1,234', change: '+12%', icon: ShoppingBag, color: 'text-primary' },
    { label: t('admin.revenue'), value: '$48,250', change: '+8%', icon: DollarSign, color: 'text-green-600' },
    { label: t('admin.reservations'), value: '89', change: '+23%', icon: Calendar, color: 'text-blue-600' },
    { label: t('admin.reviews'), value: '156', change: '+5%', icon: Star, color: 'text-yellow-600' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.dashboard')}</h1>
            <p className="text-muted-foreground">{t('admin.welcomeBack')}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} {t('admin.fromLastMonth')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.recentOrders')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.orderId')}</TableHead>
                  <TableHead>{t('admin.customer')}</TableHead>
                  <TableHead>{t('admin.total')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.time')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {t(`admin.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
