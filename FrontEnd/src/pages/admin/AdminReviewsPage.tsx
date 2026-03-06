import { useState, useEffect, useRef } from 'react';
import { Search, Star, Trash2, CheckCircle, Eye, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const PAGE_SIZE = 10;

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const getCurrentUserId = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch {
    return '';
  }
};

const formatDate = (dateStr: string) => {
  const normalized = /[Zz]|[+\-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const d = new Date(normalized);
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
};

interface Review {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  userName?: string;
  productName?: string;
}

const renderStars = (rating: number) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const AdminReviewsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Review | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const userCache = useRef<Record<string, string>>({});
  const productCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotificationPermission(p));
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    fetchReviews();
  }, []);

  const getUserName = async (userId: string): Promise<string> => {
    if (userCache.current[userId]) return userCache.current[userId];
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { headers: authHeaders() });
      if (!res.ok) return userId.slice(0, 8) + '...';
      const data = await res.json();
      const name = data.fullName || data.userName || data.email || userId.slice(0, 8) + '...';
      userCache.current[userId] = name;
      return name;
    } catch {
      return userId.slice(0, 8) + '...';
    }
  };

  const getProductName = async (productId: string): Promise<string> => {
    if (productCache.current[productId]) return productCache.current[productId];
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, { headers: authHeaders() });
      if (!res.ok) return '';
      const data = await res.json();
      const name = data.name || '';
      productCache.current[productId] = name;
      return name;
    } catch {
      return '';
    }
  };

  const enrichReviews = async (list: Review[]): Promise<Review[]> => {
    return await Promise.all(
      list.map(async (review) => {
        const userName = await getUserName(review.userId);
        const productName = review.productId ? await getProductName(review.productId) : undefined;
        return { ...review, userName, productName };
      })
    );
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Rəylər yüklənmədi');
      const data = await res.json();

      let list: Review[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.items)) list = data.items;
      else list = [];

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const enriched = await enrichReviews(list);
      setReviews(enriched);
      previousPendingCountRef.current = enriched.filter(r => !r.isApproved).length;
      setCurrentPage(1); // reset to first page on fresh fetch
    } catch (err: any) {
      toast.error(err.message || 'Rəylər yüklənərkən xəta baş verdi');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        let list: Review[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const enriched = await enrichReviews(list);
        const pendingCount = enriched.filter(r => !r.isApproved).length;
        if (pendingCount > previousPendingCountRef.current) {
          audioRef.current?.play().catch(() => {});
          toast('🔔 Yeni rəy gəldi', { description: 'Təsdiq gözləyən yeni rəy var' });
          if (notificationPermission === 'granted') {
            new Notification('🔔 Yeni rəy gəldi', { body: 'Təsdiq gözləyən yeni rəy var', icon: '/logo.png' });
          }
        }
        previousPendingCountRef.current = pendingCount;
        setReviews(enriched);
      } catch { }
    }, 15000);
    return () => clearInterval(interval);
  }, [notificationPermission]);

  const handleApprove = async (review: Review) => {
    try {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE}/api/reviews/${review.id}/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(userId),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: true } : r));
      toast.success('Rəy təsdiqləndi');
    } catch (error: any) {
      toast.error(error.message || 'Rəy təsdiqləməkdə xəta baş verdi');
    }
  };

  const handleUnapprove = async (review: Review) => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ rating: review.rating, comment: review.comment, isApproved: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: false } : r));
      toast.success('Rəyin təsdiqi ləğv edildi');
    } catch (error: any) {
      toast.error(error.message || 'Xəta baş verdi');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${deleteDialog.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.filter(r => r.id !== deleteDialog.id));
      toast.success('Rəy silindi');
      setDeleteDialog(null);
    } catch (error: any) {
      toast.error(error.message || 'Rəy silinərkən xəta baş verdi');
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      (review.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (review.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (review.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && review.isApproved) ||
      (statusFilter === 'pending' && !review.isApproved);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const pagedReviews = filteredReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.reviews')}</h1>
            <p className="text-muted-foreground">{t('admin.moderateReviews')}</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-white text-sm px-3 py-1">
              {pendingCount} təsdiq gözləyir
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchReviews')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('admin.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('admin.pending')}</SelectItem>
              <SelectItem value="approved">{t('admin.approved')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReviews} disabled={loading} className="ml-auto">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" /> : null}
            Yenilə
          </Button>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İstifadəçi</TableHead>
                  <TableHead>Məhsul / Sifariş</TableHead>
                  <TableHead>{t('admin.rating')}</TableHead>
                  <TableHead className="max-w-[300px]">{t('admin.comment')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pagedReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Rəy tapılmadı.
                    </TableCell>
                  </TableRow>
                ) : pagedReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.userName || review.userId.slice(0, 8) + '...'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {review.productName
                        ? `🍽️ ${review.productName}`
                        : review.orderId
                        ? `📦 Sifariş`
                        : '—'}
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{review.comment}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.isApproved ? 'default' : 'secondary'}>
                        {review.isApproved ? 'Təsdiqlənib' : 'Gözləyir'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Bax" onClick={() => setViewingReview(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!review.isApproved && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Təsdiqlə"
                            onClick={() => handleApprove(review)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {review.isApproved && (
                          <Button variant="ghost" size="icon" className="text-yellow-600" title="Təsdiqi ləğv et"
                            onClick={() => handleUnapprove(review)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive" title="Sil"
                          onClick={() => setDeleteDialog(review)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {filteredReviews.length} rəydən {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredReviews.length)} göstərilir
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    if (!show) {
                      const prevShow = page - 1 === 1 || Math.abs(page - 1 - currentPage) <= 1;
                      if (!prevShow) return null;
                      return <span key={`e-${page}`} className="px-1 text-muted-foreground text-sm">…</span>;
                    }
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Detail Dialog */}
        <Dialog open={!!viewingReview} onOpenChange={open => !open && setViewingReview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rəy Təfərrüatları</DialogTitle>
              <DialogDescription>#{viewingReview?.id?.slice(0, 8)}...</DialogDescription>
            </DialogHeader>
            {viewingReview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">İstifadəçi</Label>
                    <p className="text-sm mt-1">{viewingReview.userName || viewingReview.userId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reytinq</Label>
                    <div className="mt-1">{renderStars(viewingReview.rating)}</div>
                  </div>
                  {viewingReview.productName && (
                    <div>
                      <Label className="text-muted-foreground">Məhsul</Label>
                      <p className="text-sm mt-1">{viewingReview.productName}</p>
                    </div>
                  )}
                  {viewingReview.orderId && (
                    <div>
                      <Label className="text-muted-foreground">Sifariş ID</Label>
                      <p className="text-sm mt-1 font-mono">{viewingReview.orderId}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={viewingReview.isApproved ? 'default' : 'secondary'}>
                        {viewingReview.isApproved ? 'Təsdiqlənib' : 'Gözləyir'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tarix</Label>
                    <p className="text-sm mt-1">{formatDate(viewingReview.createdAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Şərh</Label>
                    <p className="text-sm mt-1">{viewingReview.comment}</p>
                  </div>
                  {viewingReview.approvedBy && (
                    <div>
                      <Label className="text-muted-foreground">Təsdiqləyən</Label>
                      <p className="text-sm mt-1">{viewingReview.approvedBy}</p>
                    </div>
                  )}
                  {viewingReview.approvedAt && (
                    <div>
                      <Label className="text-muted-foreground">Təsdiq tarixi</Label>
                      <p className="text-sm mt-1">{formatDate(viewingReview.approvedAt)}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  {!viewingReview.isApproved ? (
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => { handleApprove(viewingReview); setViewingReview(null); }}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Təsdiqlə
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => { handleUnapprove(viewingReview); setViewingReview(null); }}>
                      <XCircle className="h-4 w-4 mr-2" /> Təsdiqi ləğv et
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => { setDeleteDialog(viewingReview); setViewingReview(null); }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Sil
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingReview(null)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteDialog} onOpenChange={open => !open && setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rəyi sil?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu əməliyyat geri qaytarıla bilməz. Rəy həmişəlik silinəcək.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;