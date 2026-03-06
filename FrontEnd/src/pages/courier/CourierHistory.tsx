import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Calendar, MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';
const PAGE_SIZE = 10;

function toCamel(o: any): any {
  if (Array.isArray(o)) return o.map(toCamel);
  if (o !== null && typeof o === 'object') {
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        toCamel(v),
      ])
    );
  }
  return o;
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return toCamel(data);
}

interface OrderListItem {
  id: string;
  orderNumber: string;
  userEmail: string;
  total: number;
  status: number;
  createdAt: string;
  courierId: string | null;
  deliveryAddress?: string | null;
}

export const CourierHistory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let myEntityId: string | null = null;
      try {
        const couriersData = await apiFetch<any>(`/api/couriers?page=1&take=100`);
        const list = Array.isArray(couriersData) ? couriersData : [];
        const mine = list.find((c: any) => c.userId === user.id || c.UserId === user.id);
        myEntityId = mine?.id ?? mine?.Id ?? null;
      } catch {
        // Courier entity tapılmadı
      }

      const orders = await apiFetch<any[]>(`/api/orders?page=1&take=100`);

      const completed = orders.filter((o: any) => {
        const status = o.status ?? o.Status;
        const courierId = o.courierId ?? o.CourierId;
        // ✅ deliveryType filtri silindi — kuryerə aid olan bütün tamamlanmış sifarişlər
        return (
          (status === 6 || status === 7) &&
          (!myEntityId || !courierId || courierId === myEntityId)
        );
      });

      setAllOrders(
        completed.map((o: any) => ({
          id: o.id ?? o.Id,
          orderNumber: o.orderNumber ?? o.OrderNumber,
          userEmail: o.userEmail ?? o.UserEmail,
          total: o.total ?? o.Total,
          status: o.status ?? o.Status,
          createdAt: o.createdAt ?? o.CreatedAt,
          courierId: o.courierId ?? o.CourierId ?? null,
          deliveryAddress: o.deliveryAddress ?? o.DeliveryAddress ?? null,
        }))
      );
    } catch (err) {
      console.error('Tarixçə yüklənərkən xəta:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Tab dəyişəndə səhifəni sıfırla
  useEffect(() => { setCurrentPage(1); }, [selectedTab]);

  const filterByPeriod = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60000);

    return allOrders.filter(o => {
      const date = new Date(o.createdAt);
      switch (period) {
        case 'today': return date >= today;
        case 'week':  return date >= weekAgo;
        case 'month': return date >= monthAgo;
        default:      return true;
      }
    });
  };

  const formatDate = (dateString: string) => {
    const normalized = /[Zz]|[+\-]\d{2}:?\d{2}$/.test(dateString) ? dateString : dateString + 'Z';
    const date = new Date(normalized);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60000);

    if (date >= today) {
      return t('courier.today') + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' });
    } else if (date >= yesterday) {
      return t('courier.yesterday') + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' });
    }
    return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' });
  };

  const filteredDeliveries = filterByPeriod(selectedTab);
  const totalPages = Math.ceil(filteredDeliveries.length / PAGE_SIZE);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/courier')} className="hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('courier.myHistory')}</h1>
          <p className="text-muted-foreground">{t('courier.deliveryHistory')}</p>
        </div>
        {!loading && (
          <div className="text-sm text-muted-foreground">
            Cəmi: <span className="font-semibold text-foreground">{filteredDeliveries.length}</span> çatdırılma
          </div>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">{t('courier.today')}</TabsTrigger>
          <TabsTrigger value="week">{t('courier.thisWeek')}</TabsTrigger>
          <TabsTrigger value="month">{t('courier.thisMonth')}</TabsTrigger>
          <TabsTrigger value="all">{t('courier.allTime')}</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('courier.noDeliveriesFound')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Siyahı */}
              <div className="space-y-3">
                {paginatedDeliveries.map(order => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <p className="font-bold">{t('courier.order')} #{order.orderNumber}</p>
                            <Badge className="bg-green-600">{t('courier.completed')}</Badge>
                          </div>
                          <div className="space-y-1 text-sm ml-6">
                            <p className="font-medium">{order.userEmail}</p>
                            {order.deliveryAddress && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{order.deliveryAddress}
                              </p>
                            )}
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('courier.orderTotal')}</p>
                          <p className="font-bold">₼{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDeliveries.length)} / {filteredDeliveries.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Səhifə nömrələri */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={item}
                            variant={currentPage === item ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setCurrentPage(item as number)}
                            className="w-9 h-9"
                          >
                            {item}
                          </Button>
                        )
                      )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};