// Menu = Categories + Products birləşməsidir
// Ayrıca backend endpoint yoxdur

export {
  getCategoriesForDropdown,
  getCategories,
  type GetCategoryForDropdownDto,
  type GetCategoryItemDto,
} from './categoryDev';

export {
  getAllProducts,
  getProduct,
  type GetProductDto,
  type GetProductListItemDto,
} from './productDev';
