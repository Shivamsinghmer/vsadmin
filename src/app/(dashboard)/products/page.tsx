import { Search } from "lucide-react";
import connectToDB from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { ProductRow } from "@/components/products/ProductRow";
import { AddProduct } from "@/components/products/AddProduct";

export default async function ProductsPage() {
  await connectToDB();
  const [rawProducts, rawCategories] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).lean() as Promise<any[]>,
    Category.find().lean() as Promise<any[]>,
  ]);

  const products = JSON.parse(JSON.stringify(rawProducts));
  const categories = JSON.parse(JSON.stringify(rawCategories));

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    categoryMap[cat._id?.toString()] = cat.label ?? cat.name ?? "—";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <AddProduct categories={categories} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 block w-full pl-9 py-2.5 outline-none transition placeholder:text-slate-400"
              placeholder="Search products…"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Product</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Category</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Price</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Stock</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product: any) => (
                  <ProductRow
                    key={product._id.toString()}
                    product={{
                      _id: product._id.toString(),
                      name: product.name,
                      description: product.description,
                      images: Array.isArray(product.images) ? product.images.map(String) : [],
                      price: product.price,
                      inStock: product.inStock,
                      onSale: product.onSale,
                      bestSeller: product.bestSeller,
                      newArrival: product.newArrival,
                      unit: product.unit,
                      isVariantProduct: product.isVariantProduct ?? false,
                      variantOptions: product.variantOptions ?? { diameters: [], lengths: [], materials: [], sizes: [] },
                      pricingData: product.pricingData ?? [],
                      categoryLabel: categoryMap[product.categoryId?.toString()],
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
