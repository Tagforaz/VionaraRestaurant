import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7200';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface WorkingHour {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  workingHours: WorkingHour[];
}

const toTimeInput = (t: string) => t?.substring(0, 5) ?? '10:00';
const toTimeOnly = (t: string) => `${t}:00`;

const AdminSettingsPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<RestaurantSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    workingHours: DAYS.map(d => ({
      dayOfWeek: d.value,
      isOpen: d.value !== 0,
      openTime: '10:00',
      closeTime: '22:00',
    })),
  });

  // GET — token olmadan (AllowAnonymous)
  useEffect(() => {
    fetch(`${API_BASE}/api/restaurantsettings`)
      .then(r => r.json())
      .then((data: RestaurantSettings) => {
        const mergedHours = DAYS.map(d => {
          const found = data.workingHours?.find(w => w.dayOfWeek === d.value);
          return found
            ? { ...found, openTime: toTimeInput(found.openTime), closeTime: toTimeInput(found.closeTime) }
            : { dayOfWeek: d.value, isOpen: d.value !== 0, openTime: '10:00', closeTime: '22:00' };
        });
        setSettings({ ...data, workingHours: mergedHours });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  // PUT — token ilə (Admin)
  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const body = {
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        workingHours: settings.workingHours.map(w => ({
          dayOfWeek: w.dayOfWeek,
          isOpen: w.isOpen,
          openTime: toTimeOnly(w.openTime),
          closeTime: toTimeOnly(w.closeTime),
        })),
      };
      const res = await fetch(`${API_BASE}/api/restaurantsettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        const messages = err?.errors
          ? Object.values(err.errors).flat().join(', ')
          : err?.message ?? 'Failed to save';
        toast.error(messages as string);
        return;
      }
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHour = (dayOfWeek: number, field: keyof WorkingHour, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      workingHours: prev.workingHours.map(w =>
        w.dayOfWeek === dayOfWeek ? { ...w, [field]: value } : w
      ),
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

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
          </TabsList>

          {/* General */}
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
                    value={settings.name}
                    onChange={e => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">{t('admin.address')}</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={e => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('admin.phone')}</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('admin.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={e => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('admin.saveChanges')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.workSchedule')}</CardTitle>
                <CardDescription>Set your restaurant's operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS.map(day => {
                  const wh = settings.workingHours.find(w => w.dayOfWeek === day.value);
                  if (!wh) return null;
                  return (
                    <div key={day.value} className="flex items-center gap-4">
                      <div className="w-28">
                        <Label>{day.label}</Label>
                      </div>
                      <Switch
                        checked={wh.isOpen}
                        onCheckedChange={val => updateWorkingHour(day.value, 'isOpen', val)}
                      />
                      <Input
                        type="time"
                        value={wh.openTime}
                        onChange={e => updateWorkingHour(day.value, 'openTime', e.target.value)}
                        className="w-32"
                        disabled={!wh.isOpen}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={wh.closeTime}
                        onChange={e => updateWorkingHour(day.value, 'closeTime', e.target.value)}
                        className="w-32"
                        disabled={!wh.isOpen}
                      />
                    </div>
                  );
                })}
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('admin.saveChanges')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
