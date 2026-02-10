import { useState, useEffect, useRef } from 'react';
import { Search, Star, Trash2, CheckCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as reviewApi from '@/api/dev/reviewDev';
import type { GetReviewDto } from '@/api/dev/reviewDev';

const renderStars = (rating: number) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const AdminReviewsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviews, setReviews] = useState<GetReviewDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingReview, setViewingReview] = useState<GetReviewDto | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<GetReviewDto | null>(null);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Fetch reviews from API
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getReviews();
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setReviews(data);
      const pendingReviews = data.filter((r: GetReviewDto) => !r.isApproved);
      previousPendingCountRef.current = pendingReviews.length;
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      toast.error('Rəylər yüklənərkən xəta baş verdi');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Request notification permission and initialize audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    
    fetchReviews();
  }, []);

  // Approve review
  const handleApprove = async (review: GetReviewDto) => {
    try {
      await reviewApi.updateReview(review.id, {
        rating: review.rating,
        comment: review.comment,
        isApproved: true
      });
      toast.success('Rəy təsdiqləndi');
      fetchReviews();
    } catch (error: any) {
      console.error('Approve error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title || 
                          error.message || 
                          'Rəy təsdiqləməkdə xəta baş verdi';
      toast.error(errorMessage);
    }
  };

  // Delete review
  const handleDelete = (review: GetReviewDto) => {
    setDeleteDialog(review);
  };

  const confirmDelete = async () => {
    if (deleteDialog) {
      try {
        await reviewApi.deleteReview(deleteDialog.id);
        toast.success('Rəy silindi');
        setDeleteDialog(null);
        fetchReviews();
      } catch (error: any) {
        console.error('Delete error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.title || 
                            error.message || 
                            'Rəy silinərkən xəta baş verdi';
        toast.error(errorMessage);
      }
    }
  };

  // Poll for new pending reviews
  useEffect(() => {
    const checkForPendingReviews = () => {
      try {
        const pendingReviews = reviews.filter(r => !r.isApproved);
        const currentPendingCount = pendingReviews.length;

        if (currentPendingCount > previousPendingCountRef.current && pendingReviews[0]) {
          const latest = pendingReviews[0];

          if (audioRef.current) {
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
          }

          toast('Yeni rəy gəldi', {
            description: `ID: ${latest.id.substring(0, 8)}...`,
          });

          if (notificationPermission === 'granted') {
            new Notification('Yeni rəy gəldi', {
              body: `Reytinq: ${latest.rating} ulduz`,
              icon: '/favicon.ico',
              requireInteraction: true,
            });
          }
        }

        previousPendingCountRef.current = currentPendingCount;
      } catch (err) {
        console.error('Error checking pending reviews:', err);
      }
    };

    const interval = setInterval(checkForPendingReviews, 5000);
    return () => clearInterval(interval);
  }, [reviews, notificationPermission]);

  const filteredReviews = reviews.filter(review => {
    try {
      const matchesSearch = (review.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (review.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'approved' && review.isApproved) ||
        (statusFilter === 'pending' && !review.isApproved);
      return matchesSearch && matchesStatus;
    } catch (err) {
      console.error('Error filtering review:', review, err);
      return false;
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.reviews')}</h1>
          <p className="text-muted-foreground">{t('admin.moderateReviews')}</p>
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
        </div>

        {/* Reviews Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Product/Order</TableHead>
                  <TableHead>{t('admin.rating')}</TableHead>
                  <TableHead className="max-w-[300px]">{t('admin.comment')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Yüklənir...</TableCell></TableRow>
                ) : filteredReviews.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>Rəy tapılmadı.</TableCell></TableRow>
                ) : filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.userId.substring(0, 8)}...</TableCell>
                    <TableCell>
                      {review.productId ? `Product: ${review.productId.substring(0, 8)}...` : 
                       review.orderId ? `Order: ${review.orderId.substring(0, 8)}...` : '-'}
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{review.comment}</TableCell>
                    <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={review.isApproved ? 'default' : 'secondary'}>
                        {review.isApproved ? 'Təsdiqlənib' : 'Gözləyir'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewingReview(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!review.isApproved && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Approve" onClick={() => handleApprove(review)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive" title="Delete" onClick={() => handleDelete(review)}>
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

        {/* Review Detail View */}
        <Dialog open={!!viewingReview} onOpenChange={open => !open && setViewingReview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rəy Təfərrüatları</DialogTitle>
            </DialogHeader>
            {viewingReview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ID</Label>
                    <p className="text-sm">{viewingReview.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="text-sm">{viewingReview.userId}</p>
                  </div>
                  {viewingReview.productId && (
                    <div>
                      <Label className="text-muted-foreground">Product ID</Label>
                      <p className="text-sm">{viewingReview.productId}</p>
                    </div>
                  )}
                  {viewingReview.orderId && (
                    <div>
                      <Label className="text-muted-foreground">Order ID</Label>
                      <p className="text-sm">{viewingReview.orderId}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Reytinq</Label>
                    <div className="mt-1">{renderStars(viewingReview.rating)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={viewingReview.isApproved ? 'default' : 'secondary'}>
                        {viewingReview.isApproved ? 'Təsdiqlənib' : 'Gözləyir'}
                      </Badge>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Şərh</Label>
                    <p className="text-sm mt-1">{viewingReview.comment}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Yaradılıb</Label>
                    <p className="text-sm">{new Date(viewingReview.createdAt).toLocaleString()}</p>
                  </div>
                  {viewingReview.approvedBy && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Təsdiqləyən</Label>
                        <p className="text-sm">{viewingReview.approvedBy}</p>
                      </div>
                      {viewingReview.approvedAt && (
                        <div>
                          <Label className="text-muted-foreground">Təsdiq tarixi</Label>
                          <p className="text-sm">{new Date(viewingReview.approvedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewingReview(null)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
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
