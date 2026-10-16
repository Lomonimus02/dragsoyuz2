/**
 * Server Actions для управления данными
 *
 * Этот файл реэкспортирует все server actions для удобного импорта.
 * Использование:
 *
 * import { getProducts, getMetalRates, getGlobalSettings } from "@/app/actions";
 */

// Курсы металлов и глобальные настройки
export {
  getMetalRates,
  updateMetalRates,
  getGlobalSettings,
  updateGlobalSettings,
  updatePromoSettings,
  getPriceMarkup,
  saveInfoPageButtonColorPreset,
  type MetalRatesData,
  type UpdateMetalRatesInput,
  type MetalRatesResult,
  type GlobalSettingsData,
  type UpdateGlobalSettingsInput,
  type GlobalSettingsResult,
  type UpdatePromoSettingsInput,
} from "./settings";

export type { YearPeriodDiscounts, YearPeriodId } from "@/lib/year-discount";

// Авторизация
export {
  loginAdmin,
  logoutAdmin,
  isAuthenticated,
  changePassword,
  type LoginResult,
  type ChangePasswordResult,
} from "./auth";

// Товары
export {
  getProducts,
  getProductById,
  getProductBySlug,
  getProductsByIds,
  getAllProductSlugs,
  findBestMatchProduct,
  getShowcaseFaceForCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  type UnitType,
  type InventoryMetalsMode,
  type ProductFilters,
  type ProductWithPrice,
  type ModificationWithPrice,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductsResult,
  type ProductResult,
  type DeleteResult,
  type SearchRedirectResult,
} from "./products";

// Категории
export {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryShowcase,
  getSubcategories,
  getCategoryBreadcrumbs,
  getPinnedCategories,
  createCategory,
  updateCategory,
  updateCategoryRates,
  deleteCategory,
  type CategoryData,
  type CategoryShowcaseItem,
  type CategoryShowcaseResult,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type UpdateCategoryRatesInput,
  type CategoriesResult,
  type CategoryResult,
  type DeleteCategoryResult,
} from "./categories";

// Почтовые отправления
export {
  submitPostalRequest,
  type PostalRequestInput,
  type PostalRequestResult,
} from "./postal";

// Отзывы
export {
  submitReview,
  getApprovedReviews,
  adminGetReviews,
  adminApproveReview,
  adminDeleteReview,
  type ReviewData,
  type SubmitReviewResult,
  type ReviewsResult,
  type ReviewActionResult,
} from "./reviews";

// Статьи
export {
  getPublishedArticles,
  getPublishedArticleBySlug,
  adminListArticles,
  adminGetArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  type ArticleListItem,
  type ArticleFaqItem,
  type PublishedArticlesPage,
  type ArticleInput,
  type ArticleResult,
  type ArticlesAdminResult,
  type DeleteArticleResult,
} from "./articles";
