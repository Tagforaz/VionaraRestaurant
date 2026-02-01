import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminSettingsPage = () => {
  const { t } = useTranslation();
  // Restaurant Information State
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Savoria Restaurant',
    address: '123 Gourmet Street, Food City, FC 12345',
    phone: '+1 234 567 890',
    email: 'contact@savoria.com',
  });

  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    deliveryFee: 5.0,
    minOrder: 20.0,
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    reservations: true,
    reviews: false,
  });

  // Save Restaurant Info
  const handleSaveRestaurantInfo = () => {
    try {
      // TODO: API call to save restaurant info
      // await api.settings.updateRestaurantInfo(restaurantInfo);
      localStorage.setItem('restaurantInfo', JSON.stringify(restaurantInfo));
      toast.success('Restaurant information saved successfully!');
    } catch (error) {
      toast.error('Failed to save restaurant information');
      console.error(error);
    }
  };

  // Save Delivery Settings
  const handleSaveDeliverySettings = () => {
    try {
      // TODO: API call to save delivery settings
      // await api.settings.updateDeliverySettings(deliverySettings);
      localStorage.setItem('deliverySettings', JSON.stringify(deliverySettings));
      toast.success('Delivery settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save delivery settings');
      console.error(error);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifications = () => {
    try {
      // TODO: API call to save notification preferences
      // await api.settings.updateNotifications(notifications);
      localStorage.setItem('notifications', JSON.stringify(notifications));
      toast.success('Notification preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save notification preferences');
      console.error(error);
    }
  };
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.settings')}</h1>
          <p className="text-muted-foreground">{t('admin.manageSettings')}</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">{t('admin.general')}</TabsTrigger>
            <TabsTrigger value="schedule">{t('admin.workSchedule')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('admin.notifications')}</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.restaurantInfo')}</CardTitle>
                <CardDescription>{t('admin.updateDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('admin.restaurantName')}</Label>
                  <Input 
                    id="name" 
                    value={restaurantInfo.name}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">{t('admin.address')}</Label>
                  <Textarea 
                    id="address" 
                    value={restaurantInfo.address}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('admin.phone')}</Label>
                    <Input 
                      id="phone" 
                      value={restaurantInfo.phone}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('admin.email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={restaurantInfo.email}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveRestaurantInfo}>{t('admin.saveChanges')}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.deliverySettings')}</CardTitle>
                <CardDescription>{t('admin.configureDelivery')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('admin.enableDelivery')}</Label>
                    <p className="text-sm text-muted-foreground">{t('admin.allowDelivery')}</p>
                  </div>
                  <Switch 
                    checked={deliverySettings.enabled}
                    onCheckedChange={(checked) => setDeliverySettings({ ...deliverySettings, enabled: checked })}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryFee">{t('admin.deliveryFee')} ($)</Label>
                    <Input 
                      id="deliveryFee" 
                      type="number" 
                      value={deliverySettings.deliveryFee}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryFee: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minOrder">{t('admin.minimumOrder')} ($)</Label>
                    <Input 
                      id="minOrder" 
                      type="number" 
                      value={deliverySettings.minOrder}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, minOrder: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveDeliverySettings}>{t('admin.saveChanges')}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>Set your restaurant's operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-28">
                      <Label>{day}</Label>
                    </div>
                    <Switch defaultChecked={day !== 'Sunday'} />
                    <Input type="time" defaultValue="10:00" className="w-32" disabled={day === 'Sunday'} />
                    <span>to</span>
                    <Input type="time" defaultValue="22:00" className="w-32" disabled={day === 'Sunday'} />
                  </div>
                ))}
                <Button>Save Schedule</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Holidays</CardTitle>
                <CardDescription>Block specific dates when you're closed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="holiday">Add Holiday</Label>
                  <div className="flex gap-2">
                    <Input id="holiday" type="date" className="flex-1" />
                    <Input placeholder="Reason (optional)" className="flex-1" />
                    <Button>Add</Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">No holidays configured.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure email alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Order Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
                  </div>
                  <Switch 
                    checked={notifications.newOrders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newOrders: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reservation Requests</Label>
                    <p className="text-sm text-muted-foreground">Get notified for new reservation requests</p>
                  </div>
                  <Switch 
                    checked={notifications.reservations}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, reservations: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Reviews</Label>
                    <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                  </div>
                  <Switch 
                    checked={notifications.reviews}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, reviews: checked })}
                  />
                </div>
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
