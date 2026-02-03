import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Pizza Marqarita', price: 18.99, category: 'Pizza' },
  { id: '2', name: 'Pizza Pepperoni', price: 21.99, category: 'Pizza' },
  { id: '3', name: 'Burger', price: 15.50, category: 'Burger' },
  { id: '4', name: 'Cheeseburger', price: 17.00, category: 'Burger' },
  { id: '5', name: 'Sushi Set', price: 38.00, category: 'Sushi' },
  { id: '6', name: 'Sashimi', price: 32.00, category: 'Sushi' },
  { id: '7', name: 'Cola', price: 3.50, category: 'İçki' },
  { id: '8', name: 'Su', price: 2.00, category: 'İçki' },
  { id: '9', name: 'Kartof fri', price: 5.00, category: 'Ətraf' },
  { id: '10', name: 'Salat', price: 8.50, category: 'Ətraf' },
];

export const WaiterNewOrder = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tableNumber, setTableNumber] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', 'Pizza', 'Burger', 'Sushi', 'İçki', 'Ətraf'];

  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addItem = (item: MenuItem) => {
    const existingItem = orderItems.find(oi => oi.id === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map(oi =>
        oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi
      ));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = () => {
    if (!tableNumber || orderItems.length === 0) {
      alert('Zəhmət olmasa masa nömrəsi və məhsulları seçin');
      return;
    }
    // Here you would normally send the order to the backend
    alert(`Sifariş yaradıldı!\nMasa: ${tableNumber}\nMəhsul sayı: ${orderItems.length}\nCəm: ${totalAmount.toFixed(2)} AZN`);
    navigate('/waiter/orders');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/waiter')}
              className="text-white hover:bg-white/20"
            >
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
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Table Number */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="tableNumber">{t('waiter.tableNumber')}</Label>
                    <Input
                      id="tableNumber"
                      type="number"
                      placeholder={`${t('waiter.example')}: 5`}
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="search">{t('waiter.searchProduct')}</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Pizza, Burger..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="w-full justify-start">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat === 'all' ? t('waiter.all') : cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Menu Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="mt-1">{item.category}</Badge>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{item.price.toFixed(2)} AZN</p>
                    </div>
                    <Button
                      onClick={() => addItem(item)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('waiter.add')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t('waiter.order')} ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('waiter.noItemsAdded')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.price.toFixed(2)} AZN</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('waiter.subtotal')}:</span>
                        <span>{totalAmount.toFixed(2)} AZN</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>{t('waiter.total')}:</span>
                        <span className="text-blue-600">{totalAmount.toFixed(2)} AZN</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      disabled={!tableNumber || orderItems.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t('waiter.confirmOrder')}
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
