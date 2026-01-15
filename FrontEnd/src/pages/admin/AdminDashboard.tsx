import { ShoppingBag, Calendar, Star, DollarSign, TrendingUp, Users } from 'lucide-react';
import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Total Orders', value: '1,234', change: '+12%', icon: ShoppingBag, color: 'text-primary' },
  { label: 'Revenue', value: '$48,250', change: '+8%', icon: DollarSign, color: 'text-success' },
  { label: 'Reservations', value: '89', change: '+23%', icon: Calendar, color: 'text-info' },
  { label: 'Reviews', value: '156', change: '+5%', icon: Star, color: 'text-warning' },
];

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
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
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Connect to your API to display real order data.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
