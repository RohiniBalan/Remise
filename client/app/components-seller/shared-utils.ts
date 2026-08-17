// /components-seller/dashboard/shared-utils.ts

// --- Type Definitions ---
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

// --- Constants ---
export const DEFAULT_STORE_CATEGORIES = [
  "Food & Beverages",
  "Grocery",
  "Fashion",
  "Electronics",
  "Pharmacy",
  "Toys",
  "Home & Living",
  "Beauty",
  "Sports",
  "Other",
];

export type MergedCategory = { _id: string; name: string; isDefault: boolean };

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"] as const;

export const STATUS_STYLE: Record<string, string> = {
  Processing: "bg-amber-100 text-amber-700 border-amber-200",
  Shipped: "bg-blue-100 text-blue-700 border-blue-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-[#FF0000] border-red-200",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  PAID: "text-green-600 bg-green-50 border-green-200",
  FAILED: "text-[#FF0000] bg-red-50 border-red-200",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- Utility Functions ---
export function mergeCategories(
  customCategories: { _id: string; name: string }[],
): MergedCategory[] {
  const customNames = new Set(
    (customCategories || []).map((c) => c.name.toLowerCase()),
  );
  const defaults: MergedCategory[] = DEFAULT_STORE_CATEGORIES.filter(
    (name) => !customNames.has(name.toLowerCase()),
  ).map((name) => ({ _id: `default-${name}`, name, isDefault: true }));
  const custom: MergedCategory[] = (customCategories || []).map((c) => ({
    _id: c._id,
    name: c.name,
    isDefault: false,
  }));
  return [...custom, ...defaults];
}

export function groupSellerProductsByType(products: any[]) {
  const byTitle: Record<
    string,
    {
      title: string;
      image: string;
      category: string;
      items: any[];
    }
  > = {};

  for (const p of products) {
    const key = (p.title || "").toLowerCase().trim().replace(/\s+/g, " ");

    if (!byTitle[key]) {
      byTitle[key] = {
        title: p.title,
        image: p.imageUrl || p.images?.[0] || "",
        category: p.category || "",
        items: [],
      };
    }

    byTitle[key].items.push(p);
  }

  return Object.values(byTitle).map((v) => ({
    typeKey: v.title.toLowerCase().trim().replace(/\s+/g, " "),
    title: v.title,
    image: v.image,
    category: v.category,
    items: v.items,
    brandCount: v.items.length,
    totalStock: v.items.reduce(
      (s: number, p: any) => s + (p.totalStock || 0),
      0,
    ),
  }));
}

export async function createOneSellerProduct(
  form: SellerScanForm,
  storeId: string,
  token: string,
) {
  const disclaimer =
    "Note: Product image is for representation purposes only. Actual product may appear slightly different from what you see.";
  const description = [form.description, disclaimer]
    .filter(Boolean)
    .join("\n\n");
  const tags = form.tags
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean);
  const validTiers = form.bulkTiers.filter((t) => t.minQty && t.price);

  const catList = await fetch(`${API}/api/categories`).then((r) => r.json());
  const existing = (catList.data || []).find(
    (c: any) => c.name.toLowerCase() === form.category.toLowerCase(),
  );
  if (!existing && form.category) {
    await fetch(`${API}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: form.category }),
    });
  }

  const isDataUri = form.imageUrl?.startsWith("data:");
  let productRes: Response;
  if (isDataUri) {
    const blob = await fetch(form.imageUrl).then((r) => r.blob());
    const ext =
      blob.type === "image/svg+xml"
        ? "svg"
        : blob.type === "image/png"
          ? "png"
          : "jpg";
    const fd = new FormData();
    fd.append("image", blob, `product.${ext}`);
    fd.append("title", form.title);
    fd.append("category", form.category);
    fd.append("price", form.price);
    fd.append(
      "discountedPrice",
      String(Number(form.discountedPrice) || Number(form.price)),
    );
    if (form.storePrice)
      fd.append("storePrice", String(Number(form.storePrice)));
    if (form.storeDiscountedPrice)
      fd.append(
        "storeDiscountedPrice",
        String(Number(form.storeDiscountedPrice)),
      );
    fd.append("description", description);
    fd.append("brand", form.brand);
    fd.append("storeId", storeId);
    fd.append("availability", form.availability);
    fd.append("totalStock", String(Number(form.totalStock) || 0));
    fd.append("moq", String(Number(form.moq) || 1));
    if (tags.length) fd.append("tags", JSON.stringify(tags));
    if (validTiers.length)
      fd.append(
        "bulkPricing",
        JSON.stringify(
          validTiers.map((t) => ({
            minQty: Number(t.minQty),
            price: Number(t.price),
          })),
        ),
      );
    productRes = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } else {
    const imageUrl =
      form.imageUrl ||
      `https://loremflickr.com/400/400/${encodeURIComponent(form.title.split(" ").slice(0, 3).join(" "))}`;
    productRes = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        price: Number(form.price),
        discountedPrice: Number(form.discountedPrice) || Number(form.price),
        ...(form.storePrice ? { storePrice: Number(form.storePrice) } : {}),
        ...(form.storeDiscountedPrice
          ? { storeDiscountedPrice: Number(form.storeDiscountedPrice) }
          : {}),
        description,
        brand: form.brand,
        imageUrl,
        images: [imageUrl],
        storeId,
        availability: form.availability,
        tags,
        totalStock: Number(form.totalStock) || 0,
        moq: Number(form.moq) || 1,
        ...(validTiers.length
          ? {
              bulkPricing: validTiers.map((t) => ({
                minQty: Number(t.minQty),
                price: Number(t.price),
              })),
            }
          : {}),
      }),
    });
  }

  const data = await productRes.json();
  if (!data.success)
    throw new Error(data.message || "Failed to create product.");
  return data.data;
}

export const normalizeLoc = (value: string) => (value || "").trim().toLowerCase();

export async function lookupPincode(cityName: string): Promise<string | null> {
  if (!cityName) return null;
  try {
    const res = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`,
    );
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
      return data[0].PostOffice[0].Pincode || null;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}