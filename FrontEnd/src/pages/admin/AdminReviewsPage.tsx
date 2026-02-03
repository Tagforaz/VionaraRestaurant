import { useState, useEffect, useRef } from 'react';
import { Search, Star, Trash2, CheckCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Demo data
const demoReviews = [
  { id: '1', customer: 'John Doe', product: 'Grilled Salmon', rating: 5, comment: 'Amazing dish! Will order again.', date: '2024-01-15', status: 'approved' },
  { id: '2', customer: 'Jane Smith', product: 'Ribeye Steak', rating: 4, comment: 'Great taste, slightly overcooked.', date: '2024-01-14', status: 'pending' },
  { id: '3', customer: 'Bob Wilson', product: 'Tiramisu', rating: 5, comment: 'Best tiramisu in town!', date: '2024-01-14', status: 'approved' },
  { id: '4', customer: 'Alice Brown', product: 'Caesar Salad', rating: 3, comment: 'Good but could use more dressing.', date: '2024-01-13', status: 'pending' },
  { id: '5', customer: 'Charlie Davis', product: 'Bruschetta', rating: 5, comment: 'Perfect appetizer!', date: '2024-01-12', status: 'approved' },
];

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
  const [reviews, setReviews] = useState(demoReviews);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

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
    
    const pendingReviews = demoReviews.filter(r => r.status === 'pending');
    previousPendingCountRef.current = pendingReviews.length;
  }, []);

  // Poll for new pending reviews
  useEffect(() => {
    const checkForPendingReviews = () => {
      const pendingReviews = reviews.filter(r => r.status === 'pending');
      const currentPendingCount = pendingReviews.length;

      if (currentPendingCount > previousPendingCountRef.current) {
        const newCount = currentPendingCount - previousPendingCountRef.current;
        const latest = pendingReviews[0];

        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        toast({
          title: t('admin.newReview'),
          description: `${latest.customer} - ${latest.product}`,
        });

        if (notificationPermission === 'granted') {
          new Notification(t('admin.newReview'), {
            body: `${latest.customer} - ${latest.product}`,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
        }
      }

      previousPendingCountRef.current = currentPendingCount;
    };

    const interval = setInterval(checkForPendingReviews, 5000);
    return () => clearInterval(interval);
  }, [reviews, notificationPermission, t]);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesStatus;
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
                  <TableHead>{t('admin.customer')}</TableHead>
                  <TableHead>{t('admin.product')}</TableHead>
                  <TableHead>{t('admin.rating')}</TableHead>
                  <TableHead className="max-w-[300px]">{t('admin.comment')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.customer}</TableCell>
                    <TableCell>{review.product}</TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{review.comment}</TableCell>
                    <TableCell>{review.date}</TableCell>
                    <TableCell>
                      <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                        {t(`admin.${review.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {review.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive" title="Delete">
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
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
