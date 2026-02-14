import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/layouts';
import * as productApi from '@/api/dev/productDev';
import * as categoryApi from '@/api/dev/categoryDev';

const AdminMenuPage = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');

  // ---------------- CATEGORIES ----------------
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    imageUrl: '',
    sortOrder: 1,
    isActive: true,
  });

  // ---------------- PRODUCTS ----------------
  const [products, setProducts] = useState<any[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '', // 🔥 STRING
    imageUrl: '',
    categoryId: '',
    isAvailable: true,
  });

  // ---------------- DELETE STATES ----------------
  const [productDeleteDialog, setProductDeleteDialog] = useState<any>(null);
  const [categoryDeleteDialog, setCategoryDeleteDialog] = useState<any>(null);

  // ---------------- VIEW DETAILS STATES ----------------
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [viewingCategory, setViewingCategory] = useState<any>(null);

  // ---------------- FETCH ----------------
  const fetchProducts = async () => {
    const data = await productApi.getProducts();
    setProducts(data);
  };

  const fetchCategories = async () => {
    const data = await categoryApi.getCategories();
    setCategories(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ---------------- PRODUCT HANDLERS ----------------
  const handleProductSave = async () => {
    try {
      console.log('📦 Saving product with form data:', {
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        priceNumber: Number(productForm.price),
        categoryId: productForm.categoryId,
        isAvailable: productForm.isAvailable,
        hasImageFile: !!productImageFile,
        isEditing: !!editingProduct
      });

      const formData = new FormData();
      formData.append('Name', productForm.name);
      formData.append('Description', productForm.description);
      formData.append('Price', String(Number(productForm.price)));
      formData.append('CategoryId', productForm.categoryId);
      formData.append('IsAvailable', String(productForm.isAvailable));

      if (productImageFile) {
        formData.append('ImageFile', productImageFile);
      }

      // Log FormData contents
      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, formData);
        toast.success('Məhsul uğurla yeniləndi');
      } else {
        await productApi.createProduct(formData);
        toast.success('Məhsul uğurla əlavə edildi');
      }

      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductImageFile(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        categoryId: '',
        isAvailable: true,
    });

    fetchProducts();
    } catch (error: any) {
      console.error('❌ Product save error FULL:', error);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Response headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title || 
                          error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
                          error.message || 
                          'Məhsul əlavə edərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMessage });
    }
  };

  // ---------------- CATEGORY HANDLERS ----------------
  const handleCategorySave = async () => {
    try {
      const formData = new FormData();
      formData.append('Name', categoryForm.name);
      formData.append('SortOrder', String(categoryForm.sortOrder));
      formData.append('IsActive', String(categoryForm.isActive));

      if (imageFile) {
        formData.append('ImageFile', imageFile);
      }

      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, formData);
        toast.success('Kateqoriya uğurla yeniləndi');
      } else {
        await categoryApi.createCategory(formData);
        toast.success('Kateqoriya uğurla əlavə edildi');
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setImageFile(null);
      setCategoryForm({
        name: '',
        imageUrl: '',
        sortOrder: 1,
        isActive: true,
      });

      fetchCategories();
    } catch (error: any) {
      console.error('Category save error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title || 
                          error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
                          error.message || 
                          'Kateqoriya əlavə edərkən xəta baş verdi';
      toast.error(errorMessage);
    }
  };

  const handleCategoryEdit = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      sortOrder: cat.sortOrder ?? 1,
      isActive: cat.isActive ?? true,
    });
    setCategoryDialogOpen(true);
  };

  const handleCategoryDelete = (category: any) => {
    // Check if category has products
    const productsInCategory = products.filter(p => p.categoryId === category.id);
    setCategoryDeleteDialog({ category, productCount: productsInCategory.length });
  };

  const confirmCategoryDelete = async (soft: boolean) => {
    if (categoryDeleteDialog?.category) {
      try {
        if (soft) {
          await categoryApi.softDeleteCategory(categoryDeleteDialog.category.id);
          toast.success('Kateqoriya arxivləşdirildi');
        } else {
          await categoryApi.deleteCategory(categoryDeleteDialog.category.id);
          toast.success('Kateqoriya silindi');
        }
        setCategoryDeleteDialog(null);
        fetchCategories();
      } catch (error: any) {
        console.error('Category delete error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.title || 
                            error.message || 
                            'Kateqoriya silinərkən xəta baş verdi';
        toast.error(errorMessage);
      }
    }
  };

  const handleProductDelete = (product: any) => {
    setProductDeleteDialog(product);
  };

  const confirmProductDelete = async (soft: boolean) => {
    if (productDeleteDialog) {
      try {
        if (soft) {
          await productApi.softDeleteProduct(productDeleteDialog.id);
          toast.success('Məhsul arxivləşdirildi');
        } else {
          await productApi.deleteProduct(productDeleteDialog.id);
          toast.success('Məhsul silindi');
        }
        setProductDeleteDialog(null);
        fetchProducts();
      } catch (error: any) {
        console.error('Product delete error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.title || 
                            error.message || 
                            'Məhsul silinərkən xəta baş verdi';
        toast.error(errorMessage);
      }
    }
  };

  // ---------------- FILTER ----------------
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background text-foreground space-y-6">

        <h1 className="text-3xl font-bold">Menyu idarəetməsi</h1>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">{t('admin.products')}</TabsTrigger>
            <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
          </TabsList>

          {/* ---------------- PRODUCTS ---------------- */}
          <TabsContent value="products">
            <div className="flex justify-between mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={t('admin.searchProducts')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <Button onClick={() => setProductDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.addProduct')}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>{t('admin.price')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="flex items-center gap-2">
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl.startsWith('/uploads') ? `https://localhost:7156${p.imageUrl}` : p.imageUrl}
                              alt={p.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          {p.name}
                        </TableCell>
                        <TableCell>{p.categoryName || '-'}</TableCell>
                        <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={p.isAvailable ? 'default' : 'secondary'}>
                            {p.isAvailable ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => setViewingProduct(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              name: p.name,
                              description: p.description,
                              price: String(p.price),
                              imageUrl: p.imageUrl,
                              categoryId: p.categoryId,
                              isAvailable: p.isAvailable,
                            });
                            setProductDialogOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleProductDelete(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- CATEGORIES ---------------- */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', imageUrl: '', sortOrder: 1, isActive: true });
                setImageFile(null);
                setCategoryDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.addCategory')}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell className="flex items-center gap-2">
                          {cat.imageUrl && (
                            <img
                              src={cat.imageUrl.startsWith('/uploads') ? `https://localhost:7156${cat.imageUrl}` : cat.imageUrl}
                              alt={cat.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          {cat.name}
                        </TableCell>
                        <TableCell>{cat.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => setViewingCategory(cat)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleCategoryEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleCategoryDelete(cat)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ---------------- PRODUCT DIALOG ---------------- */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Description"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={e => {
                      const v = e.target.value;
                      if (/^\d*(\.\d{0,2})?$/.test(v)) {
                        setProductForm({ ...productForm, price: v });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={productForm.categoryId}
                    onValueChange={value => setProductForm({ ...productForm, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProductImageFile(file);
                      setProductForm({ ...productForm, imageUrl: URL.createObjectURL(file) });
                    }
                  }}
                />
                {editingProduct?.imageUrl && !productImageFile && (
                  <img
                    src={editingProduct.imageUrl.startsWith('/uploads') ? `https://localhost:7156${editingProduct.imageUrl}` : editingProduct.imageUrl}
                    alt="Current"
                    className="h-16 mt-2 rounded"
                  />
                )}
                {productImageFile && (
                  <img src={URL.createObjectURL(productImageFile)} alt="Preview" className="h-16 mt-2 rounded" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="prodAvail"
                  type="checkbox"
                  checked={productForm.isAvailable}
                  onChange={e => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                />
                <Label htmlFor="prodAvail">Available</Label>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleProductSave}>
                {editingProduct ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------------- CATEGORY DIALOG ---------------- */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setCategoryForm({ ...categoryForm, imageUrl: URL.createObjectURL(file) });
                    }
                  }}
                />
                {editingCategory?.imageUrl && !imageFile && (
                  <img
                    src={editingCategory.imageUrl.startsWith('/uploads') ? `https://localhost:7156${editingCategory.imageUrl}` : editingCategory.imageUrl}
                    alt="Current"
                    className="h-16 mt-2 rounded"
                  />
                )}
                {imageFile && (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 mt-2 rounded" />
                )}
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input
                  type="text"
                  placeholder="1"
                  value={categoryForm.sortOrder}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setCategoryForm({ ...categoryForm, sortOrder: val === '' ? 1 : Number(val) });
                    }
                  }}
                  onInput={e => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.replace(/[^\d]/g, '');
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="catActive"
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={e => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                />
                <Label htmlFor="catActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCategorySave}>
                {editingCategory ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------------- DELETE DIALOGS ---------------- */}
        <AlertDialog open={!!productDeleteDialog} onOpenChange={open => !open && setProductDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Məhsulu sil?</AlertDialogTitle>
              <AlertDialogDescription>
                Zəhmət olmasa silmə növünü seçin:
                <br/>
                <strong>Soft Delete:</strong> Məhsul arxivləşdirilir, geri qaytarıla bilər.
                <br/>
                <strong>Hard Delete:</strong> Məhsul həmişəlik silinir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <Button variant="outline" onClick={() => confirmProductDelete(true)}>Soft Delete</Button>
              <AlertDialogAction onClick={() => confirmProductDelete(false)} className="bg-destructive hover:bg-destructive/90">Hard Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!categoryDeleteDialog} onOpenChange={open => !open && setCategoryDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kateqoriyanı sil?</AlertDialogTitle>
              <AlertDialogDescription>
                {categoryDeleteDialog?.productCount > 0 ? (
                  <>
                    <span className="text-orange-600 font-semibold">⚠️ DIQQƏT: Bu kateqoriyada {categoryDeleteDialog.productCount} məhsul mövcuddur!</span>
                    <br/><br/>
                    Kateqoriyanı sildikdə, bütün məhsullar kateqoriyasız qalacaq.
                    <br/><br/>
                  </>
                ) : null}
                Zəhmət olmasa silmə növünü seçin:
                <br/>
                <strong>Soft Delete:</strong> Kateqoriya arxivləşdirilir, geri qaytarıla bilər.
                <br/>
                <strong>Hard Delete:</strong> Kateqoriya həmişəlik silinir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <Button variant="outline" onClick={() => confirmCategoryDelete(true)}>Soft Delete</Button>
              <AlertDialogAction onClick={() => confirmCategoryDelete(false)} className="bg-destructive hover:bg-destructive/90">Hard Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ---------------- PRODUCT DETAIL VIEW ---------------- */}
        <Dialog open={!!viewingProduct} onOpenChange={open => !open && setViewingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Məhsul Təfərrüatları</DialogTitle>
            </DialogHeader>
            {viewingProduct && (
              <div className="space-y-4">
                {viewingProduct.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={viewingProduct.imageUrl.startsWith('/uploads') ? `https://localhost:7156${viewingProduct.imageUrl}` : viewingProduct.imageUrl}
                      alt={viewingProduct.name}
                      className="h-48 w-48 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ad</Label>
                    <p className="font-medium">{viewingProduct.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Qiymət</Label>
                    <p className="font-medium">${Number(viewingProduct.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Kateqoriya</Label>
                    <p className="font-medium">{viewingProduct.categoryName || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={viewingProduct.isAvailable ? 'default' : 'secondary'}>
                      {viewingProduct.isAvailable ? 'Aktiv' : 'Qeyri-aktiv'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Təsvir</Label>
                    <p className="text-sm">{viewingProduct.description || 'Təsvir yoxdur'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID</Label>
                    <p className="text-xs text-muted-foreground">{viewingProduct.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Kateqoriya ID</Label>
                    <p className="text-xs text-muted-foreground">{viewingProduct.categoryId || '-'}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewingProduct(null)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------------- CATEGORY DETAIL VIEW ---------------- */}
        <Dialog open={!!viewingCategory} onOpenChange={open => !open && setViewingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kateqoriya Təfərrüatları</DialogTitle>
            </DialogHeader>
            {viewingCategory && (
              <div className="space-y-4">
                {viewingCategory.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={viewingCategory.imageUrl.startsWith('/uploads') ? `https://localhost:7156${viewingCategory.imageUrl}` : viewingCategory.imageUrl}
                      alt={viewingCategory.name}
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ad</Label>
                    <p className="font-medium">{viewingCategory.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sıralama</Label>
                    <p className="font-medium">{viewingCategory.sortOrder}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={viewingCategory.isActive ? 'default' : 'secondary'}>
                      {viewingCategory.isActive ? 'Aktiv' : 'Qeyri-aktiv'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID</Label>
                    <p className="text-xs text-muted-foreground">{viewingCategory.id}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewingCategory(null)}>Bağla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default AdminMenuPage;
