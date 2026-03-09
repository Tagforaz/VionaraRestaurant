import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryDropdown {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
}

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
}

interface OrderItem extends Product {
  quantity: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const WaiterNewOrder = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [categories, setCategories] = useState<CategoryDropdown[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // ── Fetch data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchTables();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories/dropdown`, { headers: authHeaders() });
      const data = await res.json();
      setCategories(data);
    } catch {
      toast({ title: 'Xəta', description: 'Kateqoriyalar yüklənmədi', variant: 'destructive' });
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE}/api/products?page=1&take=100`, { headers: authHeaders() });
      const data = await res.json();
      // PagedResult və ya array ola bilər
      const list = Array.isArray(data) ? data : data.data ?? [];
      setProducts(list.filter((p: Product) => p.isAvailable));
    } catch {
      toast({ title: 'Xəta', description: 'Məhsullar yüklənmədi', variant: 'destructive' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch(`${API_BASE}/api/tables?page=1&take=100`, { headers: authHeaders() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setTables(list.filter((t: Table) => t.isAvailable));
    } catch {
      toast({ title: 'Xəta', description: 'Masalar yüklənmədi', variant: 'destructive' });
    } finally {
      setLoadingTables(false);
    }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Cart actions ────────────────────────────────────────────────────────────

  const addItem = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + change) } : i)
          .filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedTableId || orderItems.length === 0) {
      toast({ title: 'Xəbərdarlıq', description: 'Masa və məhsul seçin', variant: 'destructive' });
      return;
    }

    // JWT token-dən userId al
    const token = localStorage.getItem('auth_token');
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const userId = payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

    if (!userId) {
      toast({ title: 'Xəta', description: 'İstifadəçi məlumatı tapılmadı', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload2 = {
        userId,
        tableId: selectedTableId,
        items: orderItems.map(i => ({ productId: i.id, quantity: i.quantity })),
        orderNotes: null,
        deliveryAddress: null,
        tableNumber: tables.find(t => t.id === selectedTableId)?.tableNumber ?? null,
        couponId: null,
        type: 3, // DeliveryType.DineIn
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload2),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }

      toast({ title: 'Uğurlu', description: 'Sifariş yaradıldı' });
      navigate('/waiter/orders');
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/waiter')} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('waiter.newOrder')}</h1>
              <p className="text-blue-100 text-sm">{t('waiter.createTableOrder')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Table + Menu */}
          <div className="lg:col-span-2 space-y-4">

            {/* Table select */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>{t('waiter.tableNumber')}</Label>
                    <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={loadingTables ? 'Yüklənir...' : 'Masa seçin'} />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(table => (
                          <SelectItem key={table.id} value={table.id}>
                            Masa {table.tableNumber} ({table.capacity} nəfər)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>{t('waiter.searchProduct')}</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pizza, Burger..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category tabs */}
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Kateqoriyalar yüklənir...
              </div>
            ) : (
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                  <TabsTrigger value="all">{t('waiter.all', 'Hamısı')}</TabsTrigger>
                  {categories.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Product grid */}
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    Məhsul tapılmadı
                  </div>
                ) : filteredProducts.map(product => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex gap-3 mb-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className="text-xs">{product.categoryName}</Badge>
                            <p className="font-bold text-blue-600">{product.price.toFixed(2)} ₼</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => addItem(product)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('waiter.add', 'Əlavə et')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t('waiter.order', 'Sifariş')} ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('waiter.noItemsAdded', 'Məhsul əlavə edilməyib')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.price.toFixed(2)} ₼</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-7 text-center font-semibold text-sm">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>{t('waiter.total', 'Cəm')}:</span>
                        <span className="text-blue-600">{totalAmount.toFixed(2)} ₼</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedTableId || submitting}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Göndərilir...</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-2" />{t('waiter.confirmOrder', 'Sifarişi təsdiqlə')}</>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
