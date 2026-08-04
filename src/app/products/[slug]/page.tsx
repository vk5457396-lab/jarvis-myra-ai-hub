import type { Metadata } from "next";
import ProductPagePage from "@/components/pages/ProductPagePage";
import { connectMongo } from "@/lib/db/mongoose";
import { MarketplaceProduct } from "@/lib/db/models";

const SITE_URL = "https://jarvis-myra-ai-hub.lovable.app";

interface MarketProductMeta {
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  price: number;
  thumbnail_url: string | null;
}

const buildKeywords = (p: Pick<MarketProductMeta, "title" | "category" | "short_description" | "description">) => {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "our", "was", "have", "has", "will", "can", "get", "use", "all", "any", "not", "but", "its", "into", "been", "one", "two", "new", "now", "how", "what", "why", "when", "where", "which", "who", "free", "paid", "download", "product"]);
  const text = `${p.title} ${p.category ?? ""} ${p.short_description ?? ""} ${p.description ?? ""}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
  const single = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 15);
  return Array.from(new Set([p.title.toLowerCase(), ...(p.category ? [p.category.toLowerCase()] : []), ...single])).join(", ");
};

async function fetchProductForMetadata(slug: string): Promise<MarketProductMeta | null> {
  await connectMongo();
  const p = await MarketplaceProduct.findOne({ slug, isPublished: true })
    .select("title slug shortDescription description category price thumbnailUrl")
    .lean();
  if (!p) return null;
  return {
    title: p.title,
    slug: p.slug,
    short_description: p.shortDescription ?? null,
    description: p.description ?? null,
    category: p.category ?? null,
    price: p.price,
    thumbnail_url: p.thumbnailUrl ?? null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductForMetadata(slug);
  if (!product) return {};

  const description = (product.short_description || product.description || `Download ${product.title} from CodeNinja marketplace.`).slice(0, 158);
  const url = `${SITE_URL}/products/${product.slug}`;

  return {
    title: `${product.title} | Download on CodeNinja`,
    description,
    keywords: buildKeywords(product),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.title,
      description: (product.short_description || "").slice(0, 158),
      url,
      images: product.thumbnail_url ? [{ url: product.thumbnail_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: (product.short_description || "").slice(0, 158),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductForMetadata(slug);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.short_description || product.description || product.title,
        image: product.thumbnail_url || undefined,
        category: product.category || undefined,
        url: `${SITE_URL}/products/${product.slug}`,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/products/${product.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ProductPagePage slug={slug} />
    </>
  );
}
