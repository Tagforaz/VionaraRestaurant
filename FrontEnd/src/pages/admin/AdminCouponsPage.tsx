import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tag, Search, Edit2, Trash2, Eye, Loader2, Plus, Undo2, QrCode,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// ── Types ────────────────────────────────────────────────────────────────────

interface GetCouponItemDto {
  id: string;
  code: string;
  discountType: number; // 1=Percentage, 2=FixedAmount
  discountValue: number;
  isActive: boolean;
}

interface GetCouponDto {
  id: string;
  code: string;
  discountType: number;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface GetSoftDeletedCouponDto {
  id: string;
  code: string;
  discountType: number;
  discountValue: number;
  validFrom: string;
  validTo: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface CouponFormData {
  code: string;
  discountType: number;
  discountValue: string;
  minimumOrderAmount: string;
  maximumDiscountAmount: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  isActive: boolean;
}

const defaultForm: CouponFormData = {
  code: '',
  discountType: 1,
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscountAmount: '',
  validFrom: '',
  validTo: '',
  usageLimit: '',
  isActive: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const discountTypeLabel = (type: number) =>
  type === 1 ? 'Faiz (%)' : 'Sabit Məbləğ (₼)';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('az-AZ');

const isExpired = (validTo: string) => new Date(validTo) < new Date();

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<GetCouponItemDto[]>([]);
  const [deletedCoupons, setDeletedCoupons] = useState<GetSoftDeletedCouponDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedCoupon, setSelectedCoupon] = useState<GetCouponDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showDeleted) fetchDeleted();
    else fetchCoupons();
  }, [showDeleted]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/coupons?page=1&take=100`, { headers: authHeaders() });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toast({ title: 'Xəta', description: 'Kuponlar yüklənmədi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/coupons/soft-deleted?page=1&take=100`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        toast({ title: 'Xəta', description: '401 — Token yoxdur və ya vaxtı bitib', variant: 'destructive' });
        return;
      }

      if (!res.ok) {
        toast({ title: 'Xəta', description: `Xəta: ${res.status}`, variant: 'destructive' });
        return;
      }

      const data = await res.json();
      setDeletedCoupons(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── View ───────────────────────────────────────────────────────────────────

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/coupons/${id}`, { headers: authHeaders() });
      const data = await res.json();
      setSelectedCoupon(data);
      setIsViewDialogOpen(true);
    } catch {
      toast({ title: 'Xəta', description: 'Kupon məlumatları yüklənmədi', variant: 'destructive' });
    }
  };

  // ── Create / Edit ──────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/coupons/${id}`, { headers: authHeaders() });
      const data: GetCouponDto = await res.json();
      setEditingId(id);
      setFormData({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
        minimumOrderAmount: data.minimumOrderAmount?.toString() ?? '',
        maximumDiscountAmount: data.maximumDiscountAmount?.toString() ?? '',
        validFrom: data.validFrom.slice(0, 10),
        validTo: data.validTo.slice(0, 10),
        usageLimit: data.usageLimit?.toString() ?? '',
        isActive: data.isActive,
      });
      setIsFormDialogOpen(true);
    } catch {
      toast({ title: 'Xəta', description: 'Kupon məlumatları yüklənmədi', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discountValue || !formData.validFrom || !formData.validTo) {
      toast({ title: 'Xəbərdarlıq', description: 'Zəruri sahələri doldurun', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : null,
        maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        isActive: formData.isActive,
      };

      const url = editingId
        ? `${API_BASE}/api/coupons/${editingId}`
        : `${API_BASE}/api/coupons`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }

      toast({ title: 'Uğurlu', description: editingId ? 'Kupon yeniləndi' : 'Kupon yaradıldı' });
      setIsFormDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete logic handled inline in dialog below

  // ── Restore ────────────────────────────────────────────────────────────────

  const handleRestore = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/coupons/${id}/restore`, {
        method: 'POST',
        headers: authHeaders(),
      });
      toast({ title: 'Uğurlu', description: 'Kupon bərpa edildi' });
      fetchDeleted();
    } catch {
      toast({ title: 'Xəta', description: 'Bərpa zamanı xəta', variant: 'destructive' });
    }
  };

  // ── Filtered ───────────────────────────────────────────────────────────────

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    percentage: coupons.filter(c => c.discountType === 1).length,
    fixed: coupons.filter(c => c.discountType === 2).length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Tag className="h-8 w-8" />
              Kupon Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              Endirim kuponlarının idarə edilməsi
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleted(v => !v)}>
              {showDeleted ? 'Aktivləri göstər' : 'Arxivləri göstər'}
            </Button>
            {!showDeleted && (
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Kupon
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {!showDeleted && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cəmi Kuponlar</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faiz endirim</CardTitle>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.percentage}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sabit endirim</CardTitle>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.fixed}</div></CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        {!showDeleted && (
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kupon kodu axtar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>{showDeleted ? 'Arxivlənmiş Kuponlar' : 'Kuponlar Siyahısı'}</CardTitle>
            <CardDescription>
              {showDeleted ? 'Silinmiş kuponlar — bərpa edilə bilər' : 'Bütün aktiv kuponların idarə edilməsi'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Növ</TableHead>
                  <TableHead>Dəyər</TableHead>
                  {showDeleted ? (
                    <>
                      <TableHead>Silinmə tarixi</TableHead>
                      <TableHead>Silən</TableHead>
                    </>
                  ) : (
                    <TableHead>Status</TableHead>
                  )}
                  <TableHead className="text-right">Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Yüklənir...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : showDeleted ? (
                  deletedCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Arxivlənmiş kupon yoxdur
                      </TableCell>
                    </TableRow>
                  ) : deletedCoupons.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                      <TableCell>{discountTypeLabel(c.discountType)}</TableCell>
                      <TableCell>
                        {c.discountType === 1 ? `${c.discountValue}%` : `${c.discountValue} ₼`}
                      </TableCell>
                      <TableCell>{c.deletedAt ? formatDate(c.deletedAt) : '-'}</TableCell>
                      <TableCell>{c.deletedBy || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(c.id)}>
                          <Undo2 className="h-4 w-4 text-green-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Kupon tapılmadı
                    </TableCell>
                  </TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>
                      <Badge variant={c.discountType === 1 ? 'default' : 'secondary'}>
                        {discountTypeLabel(c.discountType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {c.discountType === 1 ? `${c.discountValue}%` : `${c.discountValue} ₼`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>
                        {c.isActive ? 'Aktiv' : 'Deaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(c.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(c.id)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeleteTarget(c.id); setIsDeleteDialogOpen(true); }}
                          title="Sil"
                        >
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

        {/* Create / Edit Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Kuponu Redaktə Et' : 'Yeni Kupon Yarat'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Kupon məlumatlarını yeniləyin' : 'Yeni endirim kuponu əlavə edin'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kupon Kodu *</Label>
                  <Input
                    placeholder="SUMMER20"
                    value={formData.code}
                    onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endirim Növü *</Label>
                  <Select
                    value={formData.discountType.toString()}
                    onValueChange={v => setFormData(p => ({ ...p, discountType: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Faiz (%)</SelectItem>
                      <SelectItem value="2">Sabit Məbləğ (₼)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endirim Dəyəri *</Label>
                  <Input
                    type="number"
                    placeholder={formData.discountType === 1 ? '20' : '5.00'}
                    value={formData.discountValue}
                    onChange={e => setFormData(p => ({ ...p, discountValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>İstifadə Limiti</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.usageLimit}
                    onChange={e => setFormData(p => ({ ...p, usageLimit: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Sifariş Məbləği (₼)</Label>
                  <Input
                    type="number"
                    placeholder="10.00"
                    value={formData.minimumOrderAmount}
                    onChange={e => setFormData(p => ({ ...p, minimumOrderAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maks. Endirim Məbləği (₼)</Label>
                  <Input
                    type="number"
                    placeholder="50.00"
                    value={formData.maximumDiscountAmount}
                    onChange={e => setFormData(p => ({ ...p, maximumDiscountAmount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlanğıc Tarixi *</Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={e => setFormData(p => ({ ...p, validFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə Tarixi *</Label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={e => setFormData(p => ({ ...p, validTo: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))}
                />
                <Label>Aktiv</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Ləğv et</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? 'Yadda saxla' : 'Yarat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kupon Detalları</DialogTitle>
              <DialogDescription>Kupon haqqında tam məlumat</DialogDescription>
            </DialogHeader>
            {selectedCoupon && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-2xl font-mono font-bold">{selectedCoupon.code}</span>
                  <Badge variant={selectedCoupon.isActive ? 'default' : 'secondary'}>
                    {selectedCoupon.isActive ? 'Aktiv' : 'Deaktiv'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Endirim növü', value: discountTypeLabel(selectedCoupon.discountType) },
                    { label: 'Endirim dəyəri', value: selectedCoupon.discountType === 1 ? `${selectedCoupon.discountValue}%` : `${selectedCoupon.discountValue} ₼` },
                    { label: 'Min. sifariş', value: selectedCoupon.minimumOrderAmount ? `${selectedCoupon.minimumOrderAmount} ₼` : '-' },
                    { label: 'Maks. endirim', value: selectedCoupon.maximumDiscountAmount ? `${selectedCoupon.maximumDiscountAmount} ₼` : '-' },
                    { label: 'Başlanğıc', value: formatDate(selectedCoupon.validFrom) },
                    { label: 'Bitmə', value: formatDate(selectedCoupon.validTo) },
                    { label: 'İstifadə limiti', value: selectedCoupon.usageLimit?.toString() ?? 'Limitsiz' },
                    { label: 'İstifadə sayı', value: selectedCoupon.usageCount.toString() },
                  ].map(item => (
                    <div key={item.label} className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
                {isExpired(selectedCoupon.validTo) && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600 dark:text-red-400">
                    ⚠️ Bu kuponun müddəti bitib
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kuponu necə silmək istəyirsiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="block mb-2">
                  <strong>Arxivləşdir</strong> — Kupon saxlanılır, lazım olduqda bərpa edilə bilər.
                </span>
                <span className="block">
                  <strong>Tamamilə sil</strong> — Kupon bazadan silinir, geri qaytarıla bilməz.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:justify-between">
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <div className="flex gap-2">
                <AlertDialogAction
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={async () => {
                    if (!deleteTarget) return;
                    try {
                      await fetch(`${API_BASE}/api/coupons/${deleteTarget}/soft-delete`, {
                        method: 'DELETE', headers: authHeaders(),
                      });
                      toast({ title: 'Uğurlu', description: 'Kupon arxivləşdirildi' });
                      fetchCoupons();
                    } catch {
                      toast({ title: 'Xəta', description: 'Xəta baş verdi', variant: 'destructive' });
                    } finally {
                      setIsDeleteDialogOpen(false);
                      setDeleteTarget(null);
                    }
                  }}
                >
                  Arxivləşdir
                </AlertDialogAction>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={async () => {
                    if (!deleteTarget) return;
                    try {
                      await fetch(`${API_BASE}/api/coupons/${deleteTarget}`, {
                        method: 'DELETE', headers: authHeaders(),
                      });
                      toast({ title: 'Uğurlu', description: 'Kupon tamamilə silindi' });
                      fetchCoupons();
                    } catch {
                      toast({ title: 'Xəta', description: 'Xəta baş verdi', variant: 'destructive' });
                    } finally {
                      setIsDeleteDialogOpen(false);
                      setDeleteTarget(null);
                    }
                  }}
                >
                  Tamamilə Sil
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminLayout>
  );
}
