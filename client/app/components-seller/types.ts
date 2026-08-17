// /components-seller/dashboard/types.ts
export type Tab = "overview" | "categories" | "products" | "orders" | "settings";

export type MergedCategory = { _id: string; name: string; isDefault: boolean };

export type SellerScanForm = {
  title: string;
  category: string;
  price: string;
  discountedPrice: string;
  storePrice: string;
  storeDiscountedPrice: string;
  description: string;
  brand: string;
  imageUrl: string;
  totalStock: string;
  availability: string;
  tags: string;
  moq: string;
  bulkTiers: { minQty: string; price: string }[];
};

export type SellerBulkRow = SellerScanForm & { id: string };

export type ScanStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";
export type BulkStep = "idle" | "scanning" | "review" | "saving" | "done" | "error";