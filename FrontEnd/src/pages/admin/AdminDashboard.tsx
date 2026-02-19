import { ShoppingBag, Calendar, Star, DollarSign, TrendingUp, ArrowLeft, Loader2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const statusConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'Gözləyir',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
  2: { label: 'Təsdiqləndi', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  3: { label: 'Hazırlanır',  className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  4: { label: 'Hazırdır',    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
  5: { label: 'Yoldadır',    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  6: { label: 'Çatdırılıb',  className: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
  7: { label: 'Tamamlandı',  className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  8: { label: 'Ləğv edildi', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  9: { label: 'Uğursuz',     className: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-300' },
};

const deliveryTypeLabel = (type: number) => {
  if (type === 1) return 'Çatdırılma';
  if (type === 2) return 'Götürmə';
  return 'Restoranda';
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalReservations: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, reservationsRes, reviewsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/reservations?page=1&take=100`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() }),
      ]);

      let orders: any[] = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        orders = Array.isArray(data) ? data : data.data ?? [];
        setAllOrders(orders);
      }

      let totalReservations = 0;
      if (reservationsRes.status === 'fulfilled' && reservationsRes.value.ok) {
        const data = await reservationsRes.value.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        totalReservations = data.totalCount ?? list.length;
      }

      let totalReviews = 0;
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
        const data = await reviewsRes.value.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        totalReviews = data.totalCount ?? list.length;
      }

      const totalRevenue = orders
        .filter((o: any) => o.status === 7)
        .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0);

      setStats({ totalOrders: orders.length, totalRevenue, totalReservations, totalReviews });

      const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentOrders(sorted.slice(0, 5));
    } catch { } finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const completed = allOrders.filter((o: any) => o.status === 7);
      const months = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

      const getKey = (dateStr: string) => {
        const d = new Date(dateStr + 'Z');
        if (exportPeriod === 'weekly') {
          const jan1 = new Date(d.getFullYear(), 0, 1);
          const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
          return `${d.getFullYear()} - Həftə ${week}`;
        }
        if (exportPeriod === 'monthly') return `${d.getFullYear()} - ${months[d.getMonth()]}`;
        return `${d.getFullYear()}`;
      };

      const grouped: Record<string, { dineIn: number; delivery: number; pickup: number; count: number }> = {};
      completed.forEach((o: any) => {
        const key = getKey(o.createdAt);
        if (!grouped[key]) grouped[key] = { dineIn: 0, delivery: 0, pickup: 0, count: 0 };
        if (o.deliveryType === 3) grouped[key].dineIn += o.total ?? 0;
        else if (o.deliveryType === 1) grouped[key].delivery += o.total ?? 0;
        else if (o.deliveryType === 2) grouped[key].pickup += o.total ?? 0;
        grouped[key].count++;
      });

      const wb = XLSX.utils.book_new();
      const periodLabel = exportPeriod === 'weekly' ? 'Həftəlik' : exportPeriod === 'monthly' ? 'Aylıq' : 'İllik';

      // Sheet 1: Xülasə
      const summaryRows: any[][] = [
        ['Vionara — Gəlir Hesabatı'],
        [`Dövr: ${periodLabel}`],
        [`Export tarixi: ${new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}`],
        [],
        ['Dövr', 'Restoran Daxili (₼)', 'Çatdırılma (₼)', 'Götürmə (₼)', 'Ümumi Gəlir (₼)', 'Sifariş Sayı'],
      ];

      Object.keys(grouped).sort().forEach(key => {
        const g = grouped[key];
        summaryRows.push([key, +g.dineIn.toFixed(2), +g.delivery.toFixed(2), +g.pickup.toFixed(2), +(g.dineIn+g.delivery+g.pickup).toFixed(2), g.count]);
      });

      const tDI = Object.values(grouped).reduce((s,g) => s+g.dineIn, 0);
      const tDL = Object.values(grouped).reduce((s,g) => s+g.delivery, 0);
      const tPU = Object.values(grouped).reduce((s,g) => s+g.pickup, 0);
      const tCT = Object.values(grouped).reduce((s,g) => s+g.count, 0);
      summaryRows.push([], ['CƏMİ', +tDI.toFixed(2), +tDL.toFixed(2), +tPU.toFixed(2), +(tDI+tDL+tPU).toFixed(2), tCT]);

      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws1['!cols'] = [{wch:26},{wch:22},{wch:18},{wch:16},{wch:18},{wch:14}];
      XLSX.utils.book_append_sheet(wb, ws1, 'Gəlir Xülasəsi');

      // Sheet 2: Detallı
      const detailRows: any[][] = [['Sifariş №','Tarix','Müştəri','Növ','Məbləğ (₼)']];
      completed
        .sort((a:any,b:any) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
        .forEach((o:any) => {
          const type = o.deliveryType===3?'Restoran Daxili':o.deliveryType===1?'Çatdırılma':'Götürmə';
          detailRows.push([o.orderNumber, new Date(o.createdAt+'Z').toLocaleString('az-AZ',{timeZone:'Asia/Baku'}), o.userEmail, type, +(o.total??0).toFixed(2)]);
        });

      const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
      ws2['!cols'] = [{wch:32},{wch:22},{wch:30},{wch:18},{wch:14}];
      XLSX.utils.book_append_sheet(wb, ws2, 'Detallı Sifarişlər');

      XLSX.writeFile(wb, `Vionara_Gelir_${periodLabel}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch(err) { console.error(err); } finally { setExporting(false); }
  };

  const statCards = [
    { label: t('admin.totalOrders'), value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-primary', onClick: () => navigate('/admin/orders') },
    { label: t('admin.revenue'), value: `${stats.totalRevenue.toFixed(2)} ₼`, icon: DollarSign, color: 'text-green-600', onClick: undefined },
    { label: t('admin.reservations'), value: stats.totalReservations.toString(), icon: Calendar, color: 'text-blue-600', onClick: () => navigate('/admin/reservations') },
    { label: t('admin.reviews'), value: stats.totalReviews.toString(), icon: Star, color: 'text-yellow-600', onClick: () => navigate('/admin/reviews') },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.dashboard')}</h1>
            <p className="text-muted-foreground">{t('admin.welcomeBack')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={exportPeriod} onValueChange={(v: any) => setExportPeriod(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Həftəlik</SelectItem>
                <SelectItem value="monthly">Aylıq</SelectItem>
                <SelectItem value="yearly">İllik</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={exporting || loading} variant="outline">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Excel Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yenilə'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className={stat.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={stat.onClick}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? <div className="h-8 w-20 bg-muted animate-pulse rounded" /> : <div className="text-2xl font-bold">{stat.value}</div>}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" /> Real data
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('admin.recentOrders')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>Hamısına bax</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sifariş №</TableHead>
                  <TableHead>Müştəri</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Məbləğ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sifariş yoxdur</TableCell></TableRow>
                ) : recentOrders.map((order) => {
                  const s = statusConfig[order.status] ?? { label: `Status ${order.status}`, className: 'bg-gray-100 text-gray-800' };
                  return (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate('/admin/orders')}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{order.userEmail}</span>
                          {order.tableNumber && <span className="text-xs text-muted-foreground">Masa {order.tableNumber}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{deliveryTypeLabel(order.deliveryType)}</Badge></TableCell>
                      <TableCell className="font-medium">{order.total?.toFixed(2)} AZN</TableCell>
                      <TableCell><Badge className={s.className}>{s.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;