import ProductDetailPage from "@/components/pages/ProductDetailPage";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetailPage productId={productId} />;
}
