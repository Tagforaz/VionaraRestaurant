import { useState } from 'react';
import { useAuth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/api/services/userService';

export const ProfileNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const isStaff = ['admin', 'chef', 'waiter', 'moderator', 'courier'].includes(user?.role || '');

  const [emailNotifications, setEmailNotifications] = useState({
    orderUpdates: true,
    promotions: !isStaff,
    newsletter: false,
  });

  const [pushNotifications, setPushNotifications] = useState({
    orderStatus: true,
    newMessages: true,
    systemAlerts: isStaff,
  });

  const [smsNotifications, setSmsNotifications] = useState({
    orderConfirmation: true,
    deliveryUpdates: true,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await userService.updateNotificationSettings({
        email: emailNotifications,
        push: pushNotifications,
        sms: smsNotifications,
      });
      
      toast({
        title: 'Uğurlu',
        description: 'Bildiriş parametrləri yeniləndi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Parametrlər yenilənə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildiriş Parametrləri</h1>
        <p className="text-muted-foreground mt-2">
          Bildiriş ayarlarınızı idarə edin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Bildirişləri
          </CardTitle>
          <CardDescription>
            Email vasitəsilə bildirişləri idarə edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-orders">Sifariş yeniləmələri</Label>
              <p className="text-sm text-muted-foreground">
                Sifarişləriniz haqqında bildirişlər
              </p>
            </div>
            <Switch
              id="email-orders"
              checked={emailNotifications.orderUpdates}
              onCheckedChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, orderUpdates: checked })
              }
            />
          </div>

          <Separator />

          {!isStaff && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-promo">Kampaniyalar və endirimlər</Label>
                  <p className="text-sm text-muted-foreground">
                    Xüsusi təkliflər haqqında məlumat
                  </p>
                </div>
                <Switch
                  id="email-promo"
                  checked={emailNotifications.promotions}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, promotions: checked })
                  }
                />
              </div>

              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-newsletter">Xəbər büllüteni</Label>
              <p className="text-sm text-muted-foreground">
                Yeniliklər və məqalələr
              </p>
            </div>
            <Switch
              id="email-newsletter"
              checked={emailNotifications.newsletter}
              onCheckedChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, newsletter: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Bildirişləri
          </CardTitle>
          <CardDescription>
            Brauzer bildirişlərini idarə edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-status">Sifariş statusu</Label>
              <p className="text-sm text-muted-foreground">
                Sifariş vəziyyəti dəyişəndə bildiriş
              </p>
            </div>
            <Switch
              id="push-status"
              checked={pushNotifications.orderStatus}
              onCheckedChange={(checked) =>
                setPushNotifications({ ...pushNotifications, orderStatus: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-messages">Yeni mesajlar</Label>
              <p className="text-sm text-muted-foreground">
                Yeni mesaj aldıqda bildiriş
              </p>
            </div>
            <Switch
              id="push-messages"
              checked={pushNotifications.newMessages}
              onCheckedChange={(checked) =>
                setPushNotifications({ ...pushNotifications, newMessages: checked })
              }
            />
          </div>

          {isStaff && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-system">Sistem bildirişləri</Label>
                  <p className="text-sm text-muted-foreground">
                    Vacib sistem mesajları
                  </p>
                </div>
                <Switch
                  id="push-system"
                  checked={pushNotifications.systemAlerts}
                  onCheckedChange={(checked) =>
                    setPushNotifications({ ...pushNotifications, systemAlerts: checked })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Bildirişləri
          </CardTitle>
          <CardDescription>
            Telefon bildirişlərini idarə edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-confirm">Sifariş təsdiqi</Label>
              <p className="text-sm text-muted-foreground">
                Sifariş təsdiq olunanda SMS
              </p>
            </div>
            <Switch
              id="sms-confirm"
              checked={smsNotifications.orderConfirmation}
              onCheckedChange={(checked) =>
                setSmsNotifications({ ...smsNotifications, orderConfirmation: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-delivery">Çatdırılma yeniləmələri</Label>
              <p className="text-sm text-muted-foreground">
                Sifariş çatdırılma zamanı SMS
              </p>
            </div>
            <Switch
              id="sms-delivery"
              checked={smsNotifications.deliveryUpdates}
              onCheckedChange={(checked) =>
                setSmsNotifications({ ...smsNotifications, deliveryUpdates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dəyişiklikləri yadda saxla
        </Button>
      </div>
    </div>
  );
};
