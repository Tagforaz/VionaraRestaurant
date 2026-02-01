import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Check, X, ArrowLeft } from 'lucide-react';

const mockReviews = [
  {
    id: '1',
    userName: 'Əli Məmmədov',
    rating: 5,
    comment: 'Çox gözəl xidmət və dadlı yeməklər!',
    productName: 'Pizza Marqarita',
    isApproved: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userName: 'Leyla Həsənova',
    rating: 4,
    comment: 'Yaxşı idi, amma çatdırılma bir az geciкdi.',
    productName: null,
    isApproved: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    userName: 'Rəşad Quliyev',
    rating: 5,
    comment: 'Əla restoran!',
    productName: 'Sushi Set',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
];

export const ModeratorReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(mockReviews);

  const updateReviewStatus = (id: string, isApproved: boolean) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, isApproved } : r))
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/moderator')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Rəylər</h1>
          <p className="text-muted-foreground">Müştəri rəylərini idarə edin</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map(review => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{review.userName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    {review.productName && (
                      <span className="text-sm text-muted-foreground">• {review.productName}</span>
                    )}
                  </div>
                </div>
                {review.isApproved ? (
                  <Badge className="bg-green-600">Təsdiqlənib</Badge>
                ) : (
                  <Badge variant="secondary">Gözləyir</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{review.comment}</p>
              
              <div className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleString('az-AZ')}
              </div>

              {!review.isApproved && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => updateReviewStatus(review.id, true)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Təsdiqlə
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setReviews(prev => prev.filter(r => r.id !== review.id));
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Sil
                  </Button>
                </div>
              )}

              {review.isApproved && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => updateReviewStatus(review.id, false)}
                >
                  Təsdiqləməyi ləğv et
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
