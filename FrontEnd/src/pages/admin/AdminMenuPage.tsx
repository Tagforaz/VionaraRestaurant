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

import { Plus, Pencil, Trash2, Search, Eye, RotateCcw, Archive } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/layouts';
import * as productApi from '@/api/dev/productDev';
import * as categoryApi from '@/api/dev/categoryDev';
import type {
  GetCategoryItemDto,
  GetCategoryForDropdownDto,
  GetSoftDeletedCategoryDto,
  PostCategoryDto,
  PutCategoryDto,
} from '@/api/dev/categoryDev';
import type {
  GetProductListItemDto,
  GetSoftDeletedProductDto,
  PostProductDto,
  PutProductDto,
} from '@/api/dev/productDev';

const AdminMenuPage = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [showArchivedProducts, setShowArchivedProducts] = useState(false);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);

  // ---------------- CATEGORIES ----------------
  const [categories, setCategories] = useState<GetCategoryItemDto[]>([]);
  const [archivedCategories, setArchivedCategories] = useState<GetSoftDeletedCategoryDto[]>([]);
  const [categoriesDropdown, setCategoriesDropdown] = useState<GetCategoryForDropdownDto[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GetCategoryItemDto | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    imageUrl: string;
    sortOrder: number | '';
    isActive: boolean;
  }>({
    name: '',
    imageUrl: '',
    sortOrder: '',
    isActive: true,
  });

  // ---------------- PRODUCTS ----------------
  const [products, setProducts] = useState<GetProductListItemDto[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<GetSoftDeletedProductDto[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GetProductListItemDto | null>(null);
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

  // ---------------- LOADING STATES ----------------
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // ---------------- VALIDATION ERRORS ----------------
  const [categoryErrors, setCategoryErrors] = useState<{ name?: string; image?: string; sortOrder?: string }>({});
  const [productErrors, setProductErrors] = useState<{ name?: string; price?: string; category?: string; image?: string }>({});

  // ---------------- FETCH ----------------
  const fetchProducts = async () => {
    try {
      const data = await productApi.getProducts(1, 100);
      setProducts(data);
    } catch (error: any) {
      console.error('Fetch products error:', error.response?.data);
      toast.error('Məhsullar yüklənərkən xəta baş verdi');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategories(1, 100);
      setCategories(data);
    } catch (error: any) {
      console.error('Fetch categories error:', error.response?.data || error.message);
      toast.error('Kateqoriyalar yüklənərkən xəta baş verdi');
    }
  };

  const fetchCategoriesDropdown = async () => {
    try {
      const data = await categoryApi.getCategoriesForDropdown();
      setCategoriesDropdown(data);
    } catch (error: any) {
      console.error('Fetch categories dropdown error:', error.response?.data);
    }
  };

  const fetchArchivedProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }
      const data = await productApi.getSoftDeletedProducts(1, 100);
      setArchivedProducts(data);
    } catch (error: any) {
      console.error('Fetch archived products error:', error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Sessiyanız bitib, zəhmət olmasa yenidən daxil olun');
      } else {
        toast.error('Arxivləşdirilmiş məhsullar yüklənərkən xəta baş verdi');
      }
    }
  };

  const fetchArchivedCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }
      const data = await categoryApi.getSoftDeletedCategories(1, 100);
      setArchivedCategories(data);
    } catch (error: any) {
      console.error('Fetch archived categories error:', error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Sessiyanız bitib, zəhmət olmasa yenidən daxil olun');
      } else {
        toast.error('Arxivləşdirilmiş kateqoriyalar yüklənərkən xəta baş verdi');
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCategoriesDropdown();
  }, []);

  useEffect(() => {
    if (showArchivedProducts) {
      fetchArchivedProducts();
    }
  }, [showArchivedProducts]);

  useEffect(() => {
    if (showArchivedCategories) {
      fetchArchivedCategories();
    }
  }, [showArchivedCategories]);

  // ---------------- PRODUCT HANDLERS ----------------
  const handleProductSave = async () => {
    if (isSavingProduct) return; // Prevent duplicate submissions
    
    // Validation
    const errors: { name?: string; price?: string; category?: string; image?: string } = {};
    if (!productForm.name.trim()) errors.name = 'Ad daxil edin';
    if (!productForm.price || Number(productForm.price) <= 0) errors.price = 'Qiymət daxil edin';
    if (!productForm.categoryId) errors.category = 'Kateqoriya seçin';
    if (!editingProduct && !productImageFile) errors.image = 'Şəkil seçin';

    if (Object.keys(errors).length > 0) {
      setProductErrors(errors);
      return;
    }
    setProductErrors({});
    
    setIsSavingProduct(true);
    try {
      const productData: PostProductDto | PutProductDto = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        categoryId: productForm.categoryId,
        isAvailable: productForm.isAvailable,
        imageFile: productImageFile || undefined,
      };

      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, productData as PutProductDto);
        toast.success('Məhsul uğurla yeniləndi');
      } else {
        await productApi.createProduct(productData as PostProductDto);
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
      console.error('Product save error:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = 'Məhsul əlavə edərkən xəta baş verdi';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // ---------------- CATEGORY HANDLERS ----------------
  const handleCategorySave = async () => {
    if (isSavingCategory) return; // Prevent duplicate submissions
    
    // Validation
    const errors: { name?: string; image?: string; sortOrder?: string } = {};
    if (!categoryForm.name.trim()) errors.name = 'Ad daxil edin';
    if (!categoryForm.sortOrder && categoryForm.sortOrder !== 0) errors.sortOrder = 'Sıra daxil edin';
    if (!editingCategory && !imageFile) errors.image = 'Şəkil seçin';

    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    setCategoryErrors({});
    
    setIsSavingCategory(true);
    try {
      const categoryData: PostCategoryDto | PutCategoryDto = {
        name: categoryForm.name,
        sortOrder: categoryForm.sortOrder || 1,
        isActive: categoryForm.isActive,
        imageFile: imageFile || undefined,
      };

      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, categoryData as PutCategoryDto);
        toast.success('Kateqoriya uğurla yeniləndi');
      } else {
        await categoryApi.createCategory(categoryData as PostCategoryDto);
        toast.success('Kateqoriya uğurla əlavə edildi');
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setImageFile(null);
      setCategoryForm({
        name: '',
        imageUrl: '',
        sortOrder: '',
        isActive: true,
      });

      fetchCategories();
      fetchCategoriesDropdown();
    } catch (error: any) {
      console.error('Category save error:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = 'Kateqoriya əlavə edərkən xəta baş verdi';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCategoryEdit = (cat: GetCategoryItemDto) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      sortOrder: cat.sortOrder ?? 1,
      isActive: cat.isActive ?? true,
    });
    setCategoryErrors({});
    setCategoryDialogOpen(true);
  };

  const handleCategoryDelete = (category: GetCategoryItemDto) => {
    // Use productCount from backend instead of filtering local products
    setCategoryDeleteDialog({ category, productCount: category.productCount || 0 });
  };

  const confirmCategoryDelete = async (soft: boolean) => {
    if (categoryDeleteDialog?.category) {
      try {
        if (soft) {
          await categoryApi.softDeleteCategory(categoryDeleteDialog.category.id);
          toast.success('Kateqoriya arxivləşdirildi');
          // Refresh both active and archived lists if checkbox is checked
          fetchCategories();
          fetchCategoriesDropdown();
          if (showArchivedCategories) {
            fetchArchivedCategories();
          }
        } else {
          await categoryApi.deleteCategory(categoryDeleteDialog.category.id);
          toast.success('Kateqoriya silindi');
          fetchCategories();
          fetchCategoriesDropdown();
        }
        setCategoryDeleteDialog(null);
      } catch (error: any) {
        console.error('Category delete error:', error.response?.data);
        
        const errorData = error.response?.data;
        let errorMessage = 'Kateqoriya silinərkən xəta baş verdi';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.title) {
          errorMessage = errorData.title;
        } else if (errorData?.errors) {
          const firstError = Object.values(errorData.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleProductDelete = (product: GetProductListItemDto) => {
    setProductDeleteDialog(product);
  };

  const confirmProductDelete = async (soft: boolean) => {
    if (productDeleteDialog) {
      try {
        if (soft) {
          await productApi.softDeleteProduct(productDeleteDialog.id);
          toast.success('Məhsul arxivləşdirildi');
          // Refresh both active and archived lists if checkbox is checked
          fetchProducts();
          if (showArchivedProducts) {
            fetchArchivedProducts();
          }
        } else {
          await productApi.deleteProduct(productDeleteDialog.id);
          toast.success('Məhsul silindi');
          fetchProducts();
        }
        setProductDeleteDialog(null);
      } catch (error: any) {
        console.error('Product delete error:', error.response?.data);
        
        const errorData = error.response?.data;
        let errorMessage = 'Məhsul silinərkən xəta baş verdi';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.title) {
          errorMessage = errorData.title;
        } else if (errorData?.errors) {
          const firstError = Object.values(errorData.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const handleRestoreProduct = async (productId: string) => {
    try {
      await productApi.restoreProduct(productId);
      toast.success('Məhsul uğurla bərpa edildi');
      fetchArchivedProducts();
      fetchProducts();
    } catch (error: any) {
      console.error('Product restore error:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = 'Məhsul bərpa edərkən xəta baş verdi';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleRestoreCategory = async (categoryId: string) => {
    try {
      await categoryApi.restoreCategory(categoryId);
      toast.success('Kateqoriya uğurla bərpa edildi');
      fetchArchivedCategories();
      fetchCategories();
      fetchCategoriesDropdown();
    } catch (error: any) {
      console.error('Category restore error:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = 'Kateqoriya bərpa edərkən xəta baş verdi';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder={t('admin.searchProducts')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="showArchivedProducts"
                    type="checkbox"
                    checked={showArchivedProducts}
                    onChange={e => setShowArchivedProducts(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="showArchivedProducts" className="cursor-pointer">
                    Arxivləşdirilmiş məhsulları göstər
                  </Label>
                </div>
              </div>

              <Button onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: '', description: '', price: '', imageUrl: '', categoryId: '', isAvailable: true });
                setProductImageFile(null);
                setProductErrors({});
                setProductDialogOpen(true);
              }}>
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
                      <TableHead>Yaranma Tarixi</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="flex items-center gap-2">
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl.startsWith('/uploads') ? `https://localhost:7200${p.imageUrl}` : p.imageUrl}
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
                        <TableCell>
                          {p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0].replace(/-/g, '/') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                description: p.description,
                                price: String(p.price),
                                imageUrl: p.imageUrl,
                                categoryId: p.categoryId,
                                isAvailable: p.isAvailable,
                              });
                              setProductErrors({});
                              setProductDialogOpen(true);
                            }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleProductDelete(p)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Archived Products */}
            {showArchivedProducts && (
              <Card className="mt-6 border-2 border-dashed">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <span>Arxivləşdirilmiş Məhsullar</span>
                    <Badge variant="secondary">({archivedProducts.length})</Badge>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad</TableHead>
                        <TableHead>Kateqoriya</TableHead>
                        <TableHead>Qiymət</TableHead>
                        <TableHead>Silinmə Tarixi</TableHead>
                        <TableHead className="text-right">Əməliyyatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Arxivləşdirilmiş məhsul yoxdur
                          </TableCell>
                        </TableRow>
                      ) : (
                        archivedProducts.map(p => (
                          <TableRow key={p.id} className="opacity-60">
                            <TableCell className="flex items-center gap-2">
                              {p.imageUrl && (
                                <img
                                  src={p.imageUrl.startsWith('/uploads') ? `https://localhost:7200${p.imageUrl}` : p.imageUrl}
                                  alt={p.name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              {p.name}
                            </TableCell>
                            <TableCell>{p.categoryName || '-'}</TableCell>
                            <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                            <TableCell>
                              {p.deletedAt ? new Date(p.deletedAt).toISOString().split('T')[0].replace(/-/g, '/') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRestoreProduct(p.id)}
                                className="gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Bərpa et
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- CATEGORIES ---------------- */}
          <TabsContent value="categories">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <input
                  id="showArchivedCategories"
                  type="checkbox"
                  checked={showArchivedCategories}
                  onChange={e => setShowArchivedCategories(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="showArchivedCategories" className="cursor-pointer">
                  Arxivləşdirilmiş kateqoriyaları göstər
                </Label>
              </div>

              <Button onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', imageUrl: '', sortOrder: '', isActive: true });
                setImageFile(null);
                setCategoryErrors({});
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
                      <TableHead>Məhsul Sayı</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Yaranma Tarixi</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell className="flex items-center gap-2">
                          {cat.imageUrl && (
                            <img
                              src={cat.imageUrl.startsWith('/uploads') ? `https://localhost:7200${cat.imageUrl}` : cat.imageUrl}
                              alt={cat.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          {cat.name}
                        </TableCell>
                        <TableCell>{cat.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cat.productCount || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cat.createdAt ? new Date(cat.createdAt).toISOString().split('T')[0].replace(/-/g, '/') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCategoryEdit(cat)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCategoryDelete(cat)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Archived Categories */}
            {showArchivedCategories && (
              <Card className="mt-6 border-2 border-dashed">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <span>Arxivləşdirilmiş Kateqoriyalar</span>
                    <Badge variant="secondary">({archivedCategories.length})</Badge>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad</TableHead>
                        <TableHead>Sıralama</TableHead>
                        <TableHead>Silinmə Tarixi</TableHead>
                        <TableHead className="text-right">Əməliyyatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Arxivləşdirilmiş kateqoriya yoxdur
                          </TableCell>
                        </TableRow>
                      ) : (
                        archivedCategories.map(cat => (
                          <TableRow key={cat.id} className="opacity-60">
                            <TableCell className="flex items-center gap-2">
                              {cat.imageUrl && (
                                <img
                                  src={cat.imageUrl.startsWith('/uploads') ? `https://localhost:7200${cat.imageUrl}` : cat.imageUrl}
                                  alt={cat.name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              {cat.name}
                            </TableCell>
                            <TableCell>{cat.sortOrder}</TableCell>
                            <TableCell>
                              {cat.deletedAt ? new Date(cat.deletedAt).toISOString().split('T')[0].replace(/-/g, '/') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRestoreCategory(cat.id)}
                                className="gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Bərpa et
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ---------------- PRODUCT DIALOG ---------------- */}
        <Dialog open={productDialogOpen} onOpenChange={(open) => { if (!open) setProductErrors({}); setProductDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Məhsul məlumatlarını dəyişdirin' : 'Yeni məhsul əlavə edin'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                />
                {productErrors.name && <p className="text-sm text-red-500 mt-1">{productErrors.name}</p>}
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
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={e => {
                      setProductForm({ ...productForm, price: e.target.value });
                    }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {productErrors.price && <p className="text-sm text-red-500 mt-1">{productErrors.price}</p>}
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
                      {categoriesDropdown.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productErrors.category && <p className="text-sm text-red-500 mt-1">{productErrors.category}</p>}
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
                {productErrors.image && <p className="text-sm text-red-500 mt-1">{productErrors.image}</p>}
                {editingProduct?.imageUrl && !productImageFile && (
                  <img
                    src={editingProduct.imageUrl.startsWith('/uploads') ? `https://localhost:7200${editingProduct.imageUrl}` : editingProduct.imageUrl}
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
              <Button onClick={handleProductSave} disabled={isSavingProduct}>
                {isSavingProduct ? 'Saxlanılır...' : editingProduct ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------------- CATEGORY DIALOG ---------------- */}
        <Dialog open={categoryDialogOpen} onOpenChange={(open) => { if (!open) setCategoryErrors({}); setCategoryDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Kateqoriya məlumatlarını dəyişdirin' : 'Yeni kateqoriya əlavə edin'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
                {categoryErrors.name && <p className="text-sm text-red-500 mt-1">{categoryErrors.name}</p>}
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
                {categoryErrors.image && <p className="text-sm text-red-500 mt-1">{categoryErrors.image}</p>}
                {editingCategory?.imageUrl && !imageFile && (
                  <img
                    src={editingCategory.imageUrl.startsWith('/uploads') ? `https://localhost:7200${editingCategory.imageUrl}` : editingCategory.imageUrl}
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
                  type="number"
                  min="1"
                  placeholder="1"
                  value={categoryForm.sortOrder}
                  onChange={e => {
                    const val = e.target.value;
                    setCategoryForm({ ...categoryForm, sortOrder: val === '' ? '' : Number(val) });
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {categoryErrors.sortOrder && <p className="text-sm text-red-500 mt-1">{categoryErrors.sortOrder}</p>}
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
              <Button onClick={handleCategorySave} disabled={isSavingCategory}>
                {isSavingCategory ? 'Saxlanılır...' : editingCategory ? 'Save' : 'Add'}
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
                    <span className="text-red-600 font-semibold">⛔ Məhsul olan kateqoriya hard delete edilə bilməz!</span>
                    <br/>
                    Əvvəlcə məhsulları silin və ya başqa kateqoriyaya köçürün.
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
              <AlertDialogAction 
                onClick={() => confirmCategoryDelete(false)} 
                className="bg-destructive hover:bg-destructive/90"
                disabled={(categoryDeleteDialog?.productCount || 0) > 0}
              >
                Hard Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ---------------- PRODUCT DETAIL VIEW ---------------- */}
        <Dialog open={!!viewingProduct} onOpenChange={open => !open && setViewingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Məhsul Təfərrüatları</DialogTitle>
              <DialogDescription>
                Məhsul haqqında ətraflı məlumat
              </DialogDescription>
            </DialogHeader>
            {viewingProduct && (
              <div className="space-y-4">
                {viewingProduct.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={viewingProduct.imageUrl.startsWith('/uploads') ? `https://localhost:7200${viewingProduct.imageUrl}` : viewingProduct.imageUrl}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kateqoriya Təfərrüatları</DialogTitle>
              <DialogDescription>
                Kateqoriya haqqında ətraflı məlumat
              </DialogDescription>
            </DialogHeader>
            {viewingCategory && (
              <div className="space-y-3">
                {viewingCategory.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={viewingCategory.imageUrl.startsWith('/uploads') ? `https://localhost:7200${viewingCategory.imageUrl}` : viewingCategory.imageUrl}
                      alt={viewingCategory.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <Label className="text-muted-foreground text-sm">Ad</Label>
                    <p className="font-medium">{viewingCategory.name}</p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <Label className="text-muted-foreground text-sm">Sıralama</Label>
                    <p className="font-medium">{viewingCategory.sortOrder}</p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <Label className="text-muted-foreground text-sm">Məhsul Sayı</Label>
                    <Badge variant="outline">{viewingCategory.productCount || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <Label className="text-muted-foreground text-sm">Status</Label>
                    <Badge variant={viewingCategory.isActive ? 'default' : 'secondary'}>
                      {viewingCategory.isActive ? 'Aktiv' : 'Qeyri-aktiv'}
                    </Badge>
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
