import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Camera, Loader2, Calendar, Mail, Phone, Shield, User,
  ShoppingBag, Package, Clock, CheckCircle, ChevronDown, ChevronUp,
  Navigation, Star, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/api/services/userService';
import { ReviewModal } from '@/components/ReviewModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

const ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır', 4: 'Hazırdır',
  5: 'Yoldadır', 6: 'Çatdırıldı', 7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
};

const ORDER_STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-500', 2: 'bg-blue-500', 3: 'bg-orange-500', 4: 'bg-purple-500',
  5: 'bg-cyan-500',   6: 'bg-green-500', 7: 'bg-green-700', 8: 'bg-red-500', 9: 'bg-red-700',
};

const DELIVERY_TYPE_LABELS: Record<number, string> = {
  1: 'Çatdırılma', 2: 'Özüm götürəcəm', 3: 'Restoranda',
};

const HISTORY_PAGE_SIZE = 5;

interface OrderListItem {
  id: string;
  orderNumber: string;
  userEmail: string;
  tableNumber: number | null;
  total: number;
  status: number;
  deliveryType: number;
  createdAt: string;
}

interface OrderDetail extends OrderListItem {
  items: Array<{
    id: string; productId: string; productName: string;
    price: number; quantity: number; totalPrice: number;
  }>;
  deliveryAddress: string | null;
  orderNotes: string | null;
}

interface ExistingReview {
  rating: number;
  comment: string;
  isApproved: boolean;
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
  return res.json();
}

function getUserIdFromToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch { return ''; }
}

const isActiveStatus  = (s: number) => s >= 1 && s <= 6;
const isHistoryStatus = (s: number) => s >= 7 && s <= 9;
const getPhone = (user: any) => user?.phone || user?.phoneNumber || '';

export const ProfileInfo = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading]             = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId]   = useState<string | null>(null);
  const [reviewOrderNum, setReviewOrderNum] = useState<string | null>(null);
  const [reviewItems, setReviewItems]       = useState<Array<{productId: string; productName: string}>>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [orderDetails, setOrderDetails]   = useState<Record<string, OrderDetail>>({});
  // Stores fetched review per orderId: null = no review, object = has review
  const [orderReviews, setOrderReviews]   = useState<Record<string, ExistingReview | null>>({});
  // Tracks which orders we've already checked (to avoid refetching)
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());

  // Pagination
  const [historyPage, setHistoryPage] = useState(1);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     getPhone(user),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        email:     user.email     || '',
        phone:     getPhone(user),
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user?.id, getPhone(user)]);

  // ── Orders ───────────────────────────────────────────────────────────────
  const [allOrders, setAllOrders]         = useState<OrderListItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchMyOrders = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (!userId) return;
    setOrdersLoading(true);
    try {
      const orders = await apiFetch<OrderListItem[]>(`/api/orders?page=1&take=100&userId=${userId}`);
      const sorted = (Array.isArray(orders) ? orders : []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllOrders(sorted);
    } catch (err) {
      console.error('Sifarişlər yüklənmədi:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.role || user.role === 'customer') {
      fetchMyOrders();
    }
  }, [fetchMyOrders, user?.role]);

  // ── Fetch existing review for a completed order ──────────────────────────
  const fetchOrderReview = useCallback(async (orderId: string, productIds: string[]) => {
    if (checkedOrders.has(orderId)) return;
    setCheckedOrders(prev => new Set(prev).add(orderId));

    const userId = getUserIdFromToken();
    if (!userId || productIds.length === 0) {
      setOrderReviews(prev => ({ ...prev, [orderId]: null }));
      return;
    }

    try {
      // Use userId filter — backend returns ALL reviews (approved + pending) for this user.
      // productId filter only returns isApproved:true, so pending reviews would be missed.
      const data = await apiFetch<any[]>(
        `/api/reviews?userId=${userId}&page=1&take=100`
      );
      if (Array.isArray(data)) {
        // Find a review that belongs to this specific order
        const myReview = data.find(r => {
          const rOrderId = (r.orderId ?? r.OrderId ?? '').toString();
          return rOrderId === orderId;
        });
        if (myReview) {
          setOrderReviews(prev => ({
            ...prev,
            [orderId]: { rating: myReview.rating, comment: myReview.comment, isApproved: myReview.isApproved ?? false },
          }));
          return;
        }
      }
      setOrderReviews(prev => ({ ...prev, [orderId]: null }));
    } catch {
      setOrderReviews(prev => ({ ...prev, [orderId]: null }));
    }
  }, [checkedOrders]);

  const handleExpandOrder = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);

    let detail = orderDetails[orderId];
    if (!detail) {
      try {
        detail = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
      } catch (err) {
        console.error('Sifariş detalı yüklənmədi:', err);
        return;
      }
    }

    // Once we have detail, check if user already left a review
    const productIds = detail.items.map(i => i.productId);
    fetchOrderReview(orderId, productIds);
  };

  const activeOrders  = allOrders.filter(o => isActiveStatus(o.status));
  const historyOrders = allOrders.filter(o => isHistoryStatus(o.status));

  const totalHistoryPages = Math.ceil(historyOrders.length / HISTORY_PAGE_SIZE);
  const pagedHistoryOrders = historyOrders.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE
  );

  // ── Avatar ───────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    try {
      setLoading(true);
      const response = await userService.uploadAvatar(file);
      updateUser({ ...user!, avatarUrl: response.avatarUrl });
      toast({ title: 'Uğurlu', description: 'Avatar yeniləndi' });
    } catch {
      toast({ title: 'Xəta', description: 'Avatar yeniləmə alınmadı', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Profile update ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await userService.updateProfile({
        firstName:   formData.firstName,
        lastName:    formData.lastName,
        phoneNumber: formData.phone || undefined,
        fullAddress: undefined,
      });
      updateUser({
        ...user!,
        firstName: response.firstName || formData.firstName,
        lastName:  response.lastName  || formData.lastName,
        phone:     response.phoneNumber || response.phone || formData.phone,
      });
      toast({ title: 'Uğurlu', description: 'Profil məlumatları yeniləndi' });
    } catch (error: any) {
      toast({
        title: 'Xəta',
        description: error.response?.data?.message || 'Məlumatlar yenilənə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (order: OrderListItem) => {
    let detail = orderDetails[order.id];
    if (!detail) {
      try {
        detail = await apiFetch<OrderDetail>(`/api/orders/${order.id}`);
        setOrderDetails(prev => ({ ...prev, [order.id]: detail }));
      } catch {
        toast({ title: 'Xəta', description: 'Sifariş detalı yüklənmədi', variant: 'destructive' });
        return;
      }
    }
    const unique = Array.from(new Map(detail.items.map(i => [i.productId, i])).values());
    setReviewItems(unique.map(i => ({ productId: i.productId, productName: i.productName })));
    setReviewOrderId(order.id);
    setReviewOrderNum(order.orderNumber);
    setReviewModalOpen(true);
  };

  // After review is submitted, mark it as reviewed so button disappears
  const handleReviewClose = () => {
    setReviewModalOpen(false);
    if (reviewOrderId) {
      // Mark as reviewed optimistically
      setOrderReviews(prev => ({
        ...prev,
        [reviewOrderId]: { rating: 0, comment: '' },
      }));
    }
  };

  const getStatusBadge = (status: number) => {
    const color = ORDER_STATUS_COLORS[status] ?? 'bg-gray-500';
    const label = ORDER_STATUS_LABELS[status] ?? 'Naməlum';
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  if (!user) return null;
  const formatOrderDate = (dateStr: string) => {
    const normalized = /[Zz]|[+\-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
    const d = new Date(normalized);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };


  // ── Star display ──────────────────────────────────────────────────────────
  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  // ── History Order Card ────────────────────────────────────────────────────
  const HistoryOrderCard = ({ order }: { order: OrderListItem }) => {
    const isExpanded  = expandedOrder === order.id;
    const detail      = orderDetails[order.id];
    const canTrack    = order.status === 5;
    const isCompleted = order.status === 7;

    // undefined = not checked yet, null = no review, object = has review
    const existingReview = orderReviews[order.id];
    const reviewChecked  = order.id in orderReviews;

    return (
      <div className="border rounded-lg overflow-hidden">
        <div
          onClick={() => handleExpandOrder(order.id)}
          className="flex items-center gap-4 p-4 bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-950 group-hover:scale-110 transition-transform">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="font-semibold">Sifariş #{order.orderNumber}</p>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{formatOrderDate(order.createdAt)}</span>
              <span>•</span>
              <span className="font-semibold">{order.total.toFixed(2)} AZN</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {DELIVERY_TYPE_LABELS[order.deliveryType] ?? 'Naməlum'}
              </Badge>
            </div>
          </div>
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t bg-muted/30 p-4 space-y-3">
            {!detail ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {detail.items?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" /> Məhsullar:
                    </h4>
                    <div className="space-y-2 pl-6">
                      {detail.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs font-semibold text-blue-600">
                              {item.quantity}
                            </span>
                            <span>{item.productName}</span>
                          </div>
                          <span className="font-semibold">{item.totalPrice.toFixed(2)} AZN</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                {detail.deliveryAddress && (
                  <div className="text-sm"><span className="font-semibold text-muted-foreground">Ünvan: </span>{detail.deliveryAddress}</div>
                )}
                {detail.tableNumber && (
                  <div className="text-sm"><span className="font-semibold text-muted-foreground">Masa: </span>{detail.tableNumber}</div>
                )}
                {detail.orderNotes && (
                  <div className="text-sm"><span className="font-semibold text-muted-foreground">Qeyd: </span>{detail.orderNotes}</div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold">Cəmi:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{order.total.toFixed(2)} AZN</span>
                </div>

                {/* Review section */}
                {isCompleted && (
                  <div className="pt-1">
                    {!reviewChecked ? (
                      // Still loading review status
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Rəy yoxlanılır...
                      </div>
                    ) : existingReview ? (
                      // User already has a review — show it read-only
                      <div className={`rounded-lg border p-3 space-y-1.5 ${existingReview.isApproved ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className={`text-sm font-semibold ${existingReview.isApproved ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>Sizin rəyiniz</span>
                          </div>
                          {existingReview.isApproved ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle className="h-3 w-3" /> Təsdiqləndi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Loader2 className="h-3 w-3 animate-spin" /> Təsdiq gözləyir
                            </span>
                          )}
                        </div>
                        <StarDisplay rating={existingReview.rating} />
                        {existingReview.comment && (
                          <p className="text-sm text-muted-foreground italic">"{existingReview.comment}"</p>
                        )}
                      </div>
                    ) : (
                      // No review yet — show write button
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => { e.stopPropagation(); handleOpenReview(order); }}
                        className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                      >
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" /> Rəy Yaz
                      </Button>
                    )}
                  </div>
                )}

                {canTrack && (
                  <Button size="sm" onClick={() => navigate(`/order-tracking/${order.id}`)} className="w-full">
                    <Navigation className="h-3 w-3 mr-1" /> Canlı İzlə
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Pagination UI ─────────────────────────────────────────────────────────
  const Pagination = () => {
    if (totalHistoryPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {historyOrders.length} sifarişdən {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, historyOrders.length)} göstərilir
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            disabled={historyPage === 1}
            onClick={() => { setHistoryPage(p => p - 1); setExpandedOrder(null); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={page === historyPage ? 'default' : 'outline'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => { setHistoryPage(page); setExpandedOrder(null); }}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline" size="sm"
            disabled={historyPage === totalHistoryPages}
            onClick={() => { setHistoryPage(p => p + 1); setExpandedOrder(null); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 text-2xl font-bold px-6">
              Vionara
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
                <p className="text-amber-100 mt-1">{t('profile.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              icon: <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
              bg: 'bg-amber-100 dark:bg-amber-950', border: 'border-l-amber-500',
              label: t('profile.role'),
              value: <Badge variant="secondary" className="mt-1">{t(`profile.roles.${user.role || 'customer'}`)}</Badge>
            },
            {
              icon: <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
              bg: 'bg-blue-100 dark:bg-blue-950', border: 'border-l-blue-500',
              label: t('profile.email'),
              value: <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
            },
            {
              icon: <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />,
              bg: 'bg-green-100 dark:bg-green-950', border: 'border-l-green-500',
              label: t('profile.phone'),
              value: <p className="text-xs text-muted-foreground mt-1">{getPhone(user) || '—'}</p>
            },
            {
              icon: <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
              bg: 'bg-purple-100 dark:bg-purple-950', border: 'border-l-purple-500',
              label: t('profile.registration'),
              value: <p className="text-xs text-muted-foreground mt-1">{user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A'}</p>
            },
          ].map((card, i) => (
            <Card key={i} className={`border-l-4 ${card.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${card.bg} rounded-lg`}>{card.icon}</div>
                  <div>
                    <CardTitle className="text-sm">{card.label}</CardTitle>
                    {card.value}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Customer content */}
        {(!user.role || user.role === 'customer') ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-amber-600" />{t('profile.avatar')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-40 w-40 border-4 border-amber-600/20 shadow-lg">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="text-5xl bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <Label htmlFor="avatar-customer" className="cursor-pointer w-full">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">{t('profile.uploadPhoto')}</span>
                    </div>
                    <Input id="avatar-customer" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={loading} />
                  </Label>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />{t('profile.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('profile.firstName')}</Label>
                      <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="border-2 focus:border-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.lastName')}</Label>
                      <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="border-2 focus:border-amber-600" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" />{t('profile.email')}</Label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border-2 focus:border-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-600" />{t('profile.phone')}</Label>
                      <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+994 XX XXX XX XX" className="border-2 focus:border-green-600" />
                    </div>
                    <Separator />
                    <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.save')}
                    </Button>
                    <Button type="button" variant="outline" className="w-full border-2"
                      onClick={() => setFormData({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: getPhone(user) })}>
                      {t('profile.cancel')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Active Orders */}
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : activeOrders.length > 0 ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 blur-2xl" />
                  <Card className="relative shadow-2xl border-0 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 dark:from-gray-950 dark:via-amber-950/20 dark:to-orange-950/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg animate-pulse">
                            <Clock className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                              {t('profile.activeOrders')}
                            </CardTitle>
                            <CardDescription className="text-base mt-1">{t('profile.activeOrdersDesc')}</CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-base shadow-lg">
                          {activeOrders.length} {t('profile.order')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                      {activeOrders.map(order => (
                        <div key={order.id} className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border-2 border-amber-200/50 dark:border-amber-900/30 hover:border-amber-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-2/3 animate-pulse" />
                          </div>
                          <div className="flex items-start gap-6">
                            <div className="relative flex-shrink-0">
                              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-md opacity-50" />
                              <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                <Package className="h-8 w-8 text-white" />
                              </div>
                              <div className="absolute inset-0 rounded-2xl border-2 border-amber-400 animate-ping opacity-75" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-bold">Sifariş #{order.orderNumber}</h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">{formatOrderDate(order.createdAt)}</p>
                                </div>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 rounded-xl p-3 border border-green-200/50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Package className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-medium text-green-600">Məbləğ</span>
                                  </div>
                                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{order.total.toFixed(2)} AZN</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl p-3 border border-blue-200/50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-600">Çatdırılma növü</span>
                                  </div>
                                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                    {DELIVERY_TYPE_LABELS[order.deliveryType] ?? 'Naməlum'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => navigate(`/order-tracking/${order.id}`)}
                                className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-700 hover:via-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all py-6 rounded-xl font-semibold"
                              >
                                <span className="flex items-center gap-2">
                                  {order.status === 5 ? 'Canlı İzlə' : t('profile.trackOrder')}
                                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {/* Order History */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                        {t('profile.orderHistory')}
                      </CardTitle>
                      <CardDescription className="mt-1">{t('profile.orderHistoryDesc')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{historyOrders.length} sifariş</Badge>
                      <Button variant="ghost" size="sm" onClick={fetchMyOrders} disabled={ordersLoading}>
                        {ordersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '↻'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ordersLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : historyOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Sifariş tarixçəsi yoxdur</p>
                    </div>
                  ) : (
                    <>
                      {pagedHistoryOrders.map(order => (
                        <HistoryOrderCard key={order.id} order={order} />
                      ))}
                      <Pagination />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Staff/Admin Simple Profile */
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-amber-600" />{t('profile.avatar')}</CardTitle>
                <CardDescription>{t('profile.updateAvatar')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-amber-600/20 shadow-lg">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <Label htmlFor="avatar-staff" className="cursor-pointer w-full">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md">
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">{t('profile.uploadPhoto')}</span>
                  </div>
                  <Input id="avatar-staff" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={loading} />
                </Label>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.updateInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('profile.name')}</Label>
                      <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="border-2 focus:border-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.surname')}</Label>
                      <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="border-2 focus:border-amber-600" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" />Email</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border-2 focus:border-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-600" />{t('profile.phone')}</Label>
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+994 XX XXX XX XX" className="border-2 focus:border-green-600" />
                  </div>
                  <Separator />
                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.save')}
                    </Button>
                    <Button type="button" variant="outline" className="border-2"
                      onClick={() => setFormData({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: getPhone(user) })}>
                      {t('profile.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ReviewModal
        open={reviewModalOpen}
        onClose={handleReviewClose}
        orderId={reviewOrderId}
        orderNumber={reviewOrderNum}
        items={reviewItems}
      />
    </div>
  );
};