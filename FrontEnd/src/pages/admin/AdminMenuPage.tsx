import { useEffect, useState, useRef } from 'react';
import * as productApi from '@/api/dev/productDev';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import * as categoryApi from '@/api/dev/categoryDev';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Remove demoCategories, use state instead

// Remove demoProducts, use state from API



const AdminMenuPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', imageUrl: '', sortOrder: 1, isActive: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Products state and filter
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageFile: null,
    categoryId: '',
    isAvailable: true
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const data = await productApi.getProducts();
      setProducts(data);
    } catch (e) {
      // handle error
    }
    setProductLoading(false);
  };

  const handleProductInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setProductForm({ ...productForm, [id]: checked });
    } else if (id === 'price') {
      setProductForm({ ...productForm, [id]: Number(value) });
    } else {
      setProductForm({ ...productForm, [id]: value });
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImageFile(e.target.files[0]);
      setProductForm({ ...productForm, imageUrl: URL.createObjectURL(e.target.files[0]), imageFile: e.target.files[0] });
    }
  };

  const handleProductSave = async () => {
    try {
      const formData = new FormData();
      formData.append('Name', productForm.name);
      formData.append('Description', productForm.description);
      formData.append('Price', String(productForm.price));
      formData.append('CategoryId', productForm.categoryId);
      formData.append('IsAvailable', String(productForm.isAvailable));
      if (productImageFile) {
        formData.append('ImageFile', productImageFile);
      }
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, formData);
      } else {
        await productApi.createProduct(formData);
      }
      setProductDialogOpen(false);
      setProductForm({ name: '', description: '', price: 0, imageUrl: '', imageFile: null, categoryId: '', isAvailable: true });
      setProductImageFile(null);
      setEditingProduct(null);
      fetchProducts();
    } catch (e) {
      // handle error
    }
  };

  const handleProductEdit = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price ?? 0,
      imageUrl: prod.imageUrl || '',
      imageFile: null,
      categoryId: prod.categoryId || '',
      isAvailable: prod.isAvailable ?? true
    });
    setProductImageFile(null);
    setProductDialogOpen(true);
  };

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const data = await categoryApi.getCategories();
      setCategories(data);
    } catch (e) {
      // handle error
    }
    setCategoryLoading(false);
  };

  const handleCategoryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setCategoryForm({ ...categoryForm, [id]: checked });
    } else if (id === 'sortOrder') {
      setCategoryForm({ ...categoryForm, [id]: Number(value) });
    } else {
      setCategoryForm({ ...categoryForm, [id]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setCategoryForm({ ...categoryForm, imageUrl: URL.createObjectURL(e.target.files[0]) });
    }
  };

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
      } else {
        await categoryApi.createCategory(formData);
      }
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '', imageUrl: '', sortOrder: 1, isActive: true });
      setImageFile(null);
      setEditingCategory(null);
      fetchCategories();
    } catch (e) {
      // handle error
    }
  };

  const handleCategoryEdit = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || '',
      sortOrder: cat.sortOrder ?? 1,
      isActive: cat.isActive ?? true
    });
    setImageFile(null);
    setCategoryDialogOpen(true);
  };

  const handleCategoryDelete = async (cat: any, soft = false) => {
    try {
      if (soft) {
        await categoryApi.softDeleteCategory(cat.id);
      } else {
        await categoryApi.deleteCategory(cat.id);
      }
      fetchCategories();
    } catch (e) {
      // handle error
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.menuManagement')}</h1>
            <p className="text-muted-foreground">{t('admin.manageCategories')}</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">{t('admin.products')}</TabsTrigger>
            <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('admin.searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={productDialogOpen} onOpenChange={(open) => {
                setProductDialogOpen(open);
                if (!open) {
                  setProductForm({ name: '', description: '', price: 0, imageUrl: '', imageFile: null, categoryId: '', isAvailable: true });
                  setProductImageFile(null);
                  setEditingProduct(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('admin.addProduct')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? t('admin.editProduct') : t('admin.addProduct')}</DialogTitle>
                    <DialogDescription>
                      {t('admin.manageCategories')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t('admin.name')}</Label>
                      <Input id="name" value={productForm.name} onChange={handleProductInput} placeholder={t('admin.name')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">{t('admin.description')}</Label>
                      <Textarea id="description" value={productForm.description} onChange={handleProductInput} placeholder={t('admin.description')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">{t('admin.price')} ($)</Label>
                        <Input
                          id="price"
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]+(\.[0-9]{1,2})?$"
                          value={productForm.price}
                          onChange={e => {
                            const val = e.target.value;
                            if (/^\d*(\.\d{0,2})?$/.test(val) || val === '') {
                              setProductForm({ ...productForm, price: val });
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="categoryId">{t('admin.category')}</Label>
                        <Select
                          value={productForm.categoryId}
                          onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.category')} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imageFile">Image</Label>
                      <Input id="imageFile" type="file" onChange={handleProductImageChange} />
                      {productForm.imageUrl && (
                        <img src={productForm.imageUrl} alt="Product" className="h-16 mt-2 rounded" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="isAvailable" type="checkbox" checked={productForm.isAvailable} onChange={handleProductInput} />
                      <Label htmlFor="isAvailable">Available</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setProductDialogOpen(false); setProductForm({ name: '', description: '', price: 0, imageUrl: '', imageFile: null, categoryId: '', isAvailable: true }); setProductImageFile(null); setEditingProduct(null); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleProductSave}>{editingProduct ? t('admin.save') : t('admin.add')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>{t('admin.category')}</TableHead>
                      <TableHead>{t('admin.price')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl.startsWith('/uploads') ? `https://localhost:7156${product.imageUrl}` : product.imageUrl}
                              alt={product.name}
                              className="h-8 w-8 rounded object-cover border"
                              style={{ minWidth: 32 }}
                            />
                          ) : (
                            <span className="inline-block h-8 w-8 rounded bg-muted" />
                          )}
                          <span>{product.name}</span>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                            {product.isAvailable ? t('admin.available') : t('admin.unavailable')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleProductEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
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
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                setCategoryDialogOpen(open);
                if (!open) {
                  setCategoryForm({ name: '', description: '' });
                  setEditingCategory(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('admin.addCategory')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? t('admin.editCategory') : t('admin.addCategory')}</DialogTitle>
                    <DialogDescription>
                      {t('admin.manageCategories')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={categoryForm.name} onChange={handleCategoryInput} placeholder="Name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imageUrl">Image</Label>
                      <Input id="imageUrl" type="file" ref={fileInputRef} onChange={handleImageChange} />
                      {categoryForm.imageUrl && (
                        <img src={categoryForm.imageUrl} alt="Category" className="h-16 mt-2 rounded" />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input id="sortOrder" type="number" value={categoryForm.sortOrder} onChange={handleCategoryInput} placeholder="Sort Order" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="isActive" type="checkbox" checked={categoryForm.isActive} onChange={handleCategoryInput} />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setCategoryDialogOpen(false); setEditingCategory(null); setCategoryForm({ name: '', imageUrl: '', sortOrder: 1, isActive: true }); setImageFile(null); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleCategorySave}>{editingCategory ? t('admin.save') : t('admin.add')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    {categoryLoading ? (
                      <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No categories found.</TableCell></TableRow>
                    ) : categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {category.imageUrl || category.imageFileUrl ? (
                            <img
                              src={
                                category.imageUrl && category.imageUrl.startsWith('/uploads')
                                  ? `https://localhost:7156${category.imageUrl}`
                                  : category.imageUrl || category.imageFileUrl
                              }
                              alt={category.name}
                              className="h-8 w-8 rounded object-cover border"
                              style={{ minWidth: 32 }}
                            />
                          ) : (
                            <span className="inline-block h-8 w-8 rounded bg-muted" />
                          )}
                          <span>{category.name}</span>
                        </TableCell>
                        <TableCell>{category.sortOrder ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleCategoryEdit(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleCategoryDelete(category)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCategoryDelete(category, true)} title="Soft Delete">
                              <Trash2 className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuPage;
