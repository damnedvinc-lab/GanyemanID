/**
 * U-Frost ID — satu-satunya sumber data mock (tanpa backend).
 *
 * Angka harga, HPP & stok mengikuti dataset contoh pada brief.
 * Turunan yang bukan dari dataset ditandai `// asumsi:` agar mudah diganti.
 *
 * Foto: unsplash.com tidak dapat dijangkau dari lingkungan build saat
 * prototype dibuat, sehingga ID foto tidak bisa diverifikasi. Field `image`
 * sengaja dikosongkan → komponen <ProductImage> menampilkan fallback frost.
 * Isi `PHOTOS` dengan URL images.unsplash.com yang sudah dicek untuk
 * menampilkan foto asli.
 */

export type Uom = "pack" | "kg" | "karton";
export type CategoryId = "ayam" | "daging" | "seafood" | "olahan" | "sayur" | "bumbu";
export type IconKey =
  | "drumstick"
  | "beef"
  | "fish"
  | "shrimp"
  | "popcorn"
  | "wheat"
  | "bean"
  | "soup"
  | "box";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  icon: IconKey;
}

export interface TierRule {
  minQty: number;
  price: number;
}

/** SKU = unit yang distok & dijual. Stok disimpan dalam satuan jual SKU ini. */
export interface Sku {
  id: string;
  code: string;
  productId: string;
  uom: Uom;
  /** Label varian, mis. "500 g", "per kg", "1 karton · 12 pack" */
  label: string;
  /** Berat bersih per 1 satuan jual (gram) — satuan dasar BR-UOM-01 */
  gramsPerUnit: number;
  /** Untuk karton: isi pack per karton */
  packsPerUnit?: number;
  /** Harga retail per satuan jual */
  price: number;
  /** asumsi: harga reseller = retail × 0,92, dibulatkan ke bawah per Rp 500 */
  resellerPrice: number;
  hpp: number;
  stock: number;
  minStock: number;
  /** langkah qty: 1 untuk pack/karton, 0,25 untuk produk timbang (BR-UOM-05) */
  step: number;
  minQty: number;
  tiers: TierRule[];
  /** Berat kemasan primer per satuan (vakum/plastik), gram */
  packagingGrams: number;
  dimensions: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  note: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  icon: IconKey;
  tagline: string;
  description: string;
  highlights: string[];
  storage: string;
  shelfLife: string;
  thawing: string;
  cookingTip: string;
  origin: string;
  skuIds: string[];
  defaultSkuId: string;
  /** Pilihan potongan (tanpa beda harga) — hanya untuk produk tertentu */
  variants?: ProductVariant[];
  soldCount: number;
  addedAt: string;
  keywords: string[];
  image?: string;
}

/* ------------------------------------------------------------------ */
/* Foto — isi dengan URL Unsplash terverifikasi (lihat catatan di atas) */
/* ------------------------------------------------------------------ */
export const PHOTOS: Partial<Record<string, string>> = {
  // "ayam-fillet-boneless": "https://images.unsplash.com/photo-...?w=900&q=80",
};

/* ------------------------------------------------------------------ */
/* Pengaturan toko                                                     */
/* ------------------------------------------------------------------ */
export const STORE = {
  brand: "U-Frost ID",
  tagline: "Beku dari -18°C, tetap beku sampai dapurmu",
  legalName: "U-Frost ID",
  address: "Jl. Raya Pasar Minggu No. 27, Jakarta Selatan 12510",
  whatsapp: "0811-1800-1818",
  whatsappIntl: "6281118001818",
  email: "halo@ufrost.id",
  bank: { name: "Bank BCA", account: "0123 4567 89", holder: "U-Frost ID" },
  cutoffHour: 14,
  minOrderValue: 100_000,
  minOrderGrams: 2_000,
  claimWindowHours: 6,
  paymentWindowHours: 24,
  /** Box insulated + ice gel per box (gram) — BR-ORD-04 */
  boxTareGrams: 1_200,
  /** Kapasitas bersih per box (gram) */
  boxCapacityGrams: 10_000,
  /** Tanggal demo prototype (jam mengikuti jam asli WIB atau simulasi) */
  demoDate: "2026-11-25",
} as const;

export interface ShippingZone {
  id: "Z1" | "Z2" | "Z3";
  name: string;
  coverage: string;
  /** awalan 2 digit kode pos */
  postalPrefixes: string[];
  /** tarif untuk 3 kg pertama (berat kirim) */
  baseFee: number;
  baseKg: number;
  perKg: number;
  /** lama transit dalam hari kerja */
  transitMin: number;
  transitMax: number;
  /** hari kirim, 0 = Minggu … 6 = Sabtu */
  shipDays: number[];
  note: string;
}

// asumsi: tarif zona contoh — tarif final masih Pertanyaan Terbuka Q5 PRD
export const ZONES: ShippingZone[] = [
  {
    id: "Z1",
    name: "Zona 1 · Jabodetabek",
    coverage: "Jakarta, Bogor, Depok, Tangerang, Bekasi",
    postalPrefixes: ["10", "11", "12", "13", "14", "15", "16", "17"],
    baseFee: 20_000,
    baseKg: 3,
    perKg: 5_000,
    transitMin: 1,
    transitMax: 1,
    shipDays: [1, 2, 3, 4, 5, 6],
    note: "Kurir berpendingin rekanan, tiba H+1 dari tanggal kirim.",
  },
  {
    id: "Z2",
    name: "Zona 2 · Pulau Jawa",
    coverage: "Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Banten",
    postalPrefixes: [
      "40", "41", "42", "43", "44", "45", "46", "50", "51", "52", "53", "54",
      "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66",
      "67", "68", "69",
    ],
    baseFee: 35_000,
    baseKg: 3,
    perKg: 9_000,
    transitMin: 1,
    transitMax: 2,
    shipDays: [1, 2, 3, 4, 5],
    note: "Tidak dikirim Sabtu agar paket tidak menginap di gudang transit akhir pekan.",
  },
  {
    id: "Z3",
    name: "Zona 3 · Bali & Sumatra Selatan",
    coverage: "Bali, Lampung, Sumatra Selatan",
    postalPrefixes: ["30", "31", "32", "34", "35", "80", "81", "82"],
    baseFee: 55_000,
    baseKg: 3,
    perKg: 14_000,
    transitMin: 2,
    transitMax: 2,
    shipDays: [1, 2, 3, 4],
    note: "Hanya dikirim Senin–Kamis. Transit 2 hari dengan ice gel ekstra.",
  },
];

/* ------------------------------------------------------------------ */
/* Kategori & produk                                                   */
/* ------------------------------------------------------------------ */
export const CATEGORIES: Category[] = [
  { id: "ayam", name: "Ayam", blurb: "Fillet & utuh", icon: "drumstick" },
  { id: "daging", name: "Daging", blurb: "Sapi giling", icon: "beef" },
  { id: "seafood", name: "Seafood", blurb: "Ikan & udang", icon: "fish" },
  { id: "olahan", name: "Olahan", blurb: "Nugget & bakso", icon: "popcorn" },
  { id: "sayur", name: "Sayur & Kentang", blurb: "Siap goreng & rebus", icon: "bean" },
  { id: "bumbu", name: "Bumbu", blurb: "Segera hadir", icon: "soup" },
];

const t = (minQty: number, price: number): TierRule => ({ minQty, price });

export const SKUS: Sku[] = [
  {
    id: "AYF-500", code: "UF-AYF-500", productId: "ayam-fillet-boneless", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 47_500, resellerPrice: 43_500, hpp: 38_000,
    stock: 42, minStock: 20, step: 1, minQty: 1, tiers: [t(6, 46_000)],
    packagingGrams: 20, dimensions: "22 × 16 × 3 cm",
  },
  {
    id: "AYF-KRT", code: "UF-AYF-KRT", productId: "ayam-fillet-boneless", uom: "karton",
    label: "1 karton · 12 pack", gramsPerUnit: 6_000, packsPerUnit: 12, price: 540_000,
    resellerPrice: 496_500, hpp: 456_000, stock: 7, minStock: 3, step: 1, minQty: 1, tiers: [],
    packagingGrams: 450, dimensions: "40 × 30 × 22 cm",
  },
  {
    id: "DSG-500", code: "UF-DSG-500", productId: "daging-sapi-giling", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 65_000, resellerPrice: 59_500, hpp: 54_000,
    stock: 18, minStock: 10, step: 1, minQty: 1, tiers: [],
    packagingGrams: 20, dimensions: "20 × 15 × 3 cm",
  },
  {
    id: "IDF-1KG", code: "UF-IDF-1KG", productId: "ikan-dori-fillet", uom: "pack",
    label: "1 kg", gramsPerUnit: 1_000, price: 58_000, resellerPrice: 53_000, hpp: 46_000,
    stock: 25, minStock: 10, step: 1, minQty: 1, tiers: [],
    packagingGrams: 30, dimensions: "30 × 20 × 4 cm",
  },
  {
    id: "UDK-500", code: "UF-UDK-500", productId: "udang-kupas", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 75_000, resellerPrice: 69_000, hpp: 61_000,
    stock: 9, minStock: 10, step: 1, minQty: 1, tiers: [],
    packagingGrams: 20, dimensions: "22 × 16 × 3 cm",
  },
  {
    id: "NGA-500", code: "UF-NGA-500", productId: "nugget-ayam", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 32_000, resellerPrice: 29_000, hpp: 24_500,
    stock: 60, minStock: 20, step: 1, minQty: 1, tiers: [t(5, 30_500)],
    packagingGrams: 25, dimensions: "25 × 18 × 5 cm",
  },
  {
    id: "KFF-1KG", code: "UF-KFF-1KG", productId: "kentang-french-fries", uom: "pack",
    label: "1 kg", gramsPerUnit: 1_000, price: 38_000, resellerPrice: 34_500, hpp: 29_000,
    stock: 34, minStock: 15, step: 1, minQty: 1, tiers: [t(5, 36_500)],
    packagingGrams: 25, dimensions: "32 × 22 × 6 cm",
  },
  {
    id: "BKS-500", code: "UF-BKS-500", productId: "bakso-sapi", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 42_000, resellerPrice: 38_500, hpp: 33_000,
    stock: 0, minStock: 15, step: 1, minQty: 1, tiers: [],
    packagingGrams: 20, dimensions: "22 × 16 × 5 cm",
  },
  {
    id: "EDM-500", code: "UF-EDM-500", productId: "edamame", uom: "pack",
    label: "500 g", gramsPerUnit: 500, price: 25_000, resellerPrice: 23_000, hpp: 18_000,
    stock: 51, minStock: 20, step: 1, minQty: 1, tiers: [t(6, 23_500)],
    packagingGrams: 15, dimensions: "24 × 17 × 4 cm",
  },
  {
    id: "AYU-KG", code: "UF-AYU-KG", productId: "ayam-utuh", uom: "kg",
    label: "per kg", gramsPerUnit: 1_000, price: 42_000, resellerPrice: 38_500, hpp: 34_000,
    stock: 30, minStock: 10, step: 0.25, minQty: 1, tiers: [],
    packagingGrams: 30, dimensions: "Ekor ±1,0–1,3 kg",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "ayam-fillet-boneless",
    slug: "ayam-fillet-boneless-500g",
    name: "Ayam Fillet Boneless",
    category: "ayam",
    icon: "drumstick",
    tagline: "Dada ayam tanpa tulang & kulit, siap potong dadu",
    description:
      "Dada ayam broiler tanpa tulang dan kulit, dibersihkan lalu dibekukan cepat (IQF) dalam kemasan vakum 500 g. Bentuk utuh per fillet, jadi kamu bebas potong sesuai masakan.",
    highlights: ["Tanpa tulang & kulit", "Kemasan vakum 500 g", "±4–5 fillet per pack"],
    storage: "Simpan di freezer -18°C. Setelah dicairkan jangan dibekukan ulang.",
    shelfLife: "9 bulan di -18°C sejak tanggal produksi",
    thawing: "Pindahkan ke chiller 8–10 jam, atau rendam kemasan tertutup di air dingin 45 menit.",
    cookingTip: "Cocok untuk ayam teriyaki, sup, atau ayam geprek. Bumbui saat masih setengah beku agar meresap.",
    origin: "Vendor unggas bersertifikat Halal, Bogor",
    skuIds: ["AYF-500", "AYF-KRT"],
    defaultSkuId: "AYF-500",
    soldCount: 812,
    addedAt: "2026-03-02",
    keywords: ["chicken fillet", "dada ayam", "boneless", "ayam fillet"],
  },
  {
    id: "daging-sapi-giling",
    slug: "daging-sapi-giling-500g",
    name: "Daging Sapi Giling",
    category: "daging",
    icon: "beef",
    tagline: "Giling sekali, lemak ±15%, untuk isian & bakso rumahan",
    description:
      "Daging sapi lokal bagian chuck digiling sekali dengan kadar lemak ±15%. Dibekukan pipih dalam kemasan 500 g agar cepat dicairkan.",
    highlights: ["Lemak ±15%", "Dibekukan pipih", "Tanpa campuran tepung"],
    storage: "Simpan di freezer -18°C. Setelah dicairkan jangan dibekukan ulang.",
    shelfLife: "6 bulan di -18°C sejak tanggal produksi",
    thawing: "Chiller 6–8 jam. Bentuk pipih membuatnya cair lebih cepat.",
    cookingTip: "Untuk spaghetti bolognese, isian martabak, atau perkedel daging.",
    origin: "Rumah potong hewan bersertifikat Halal, Bekasi",
    skuIds: ["DSG-500"],
    defaultSkuId: "DSG-500",
    soldCount: 430,
    addedAt: "2026-03-02",
    keywords: ["ground beef", "minced beef", "daging cincang"],
  },
  {
    id: "ikan-dori-fillet",
    slug: "ikan-dori-fillet-1kg",
    name: "Ikan Dori Fillet",
    category: "seafood",
    icon: "fish",
    tagline: "Fillet putih tanpa duri, isi 4–6 potong per kg",
    description:
      "Fillet ikan dori (pangasius) tanpa duri dan kulit, dibekukan per potong (IQF) sehingga bisa diambil seperlunya tanpa mencairkan satu pack.",
    highlights: ["Tanpa duri & kulit", "IQF per potong", "4–6 potong per kg"],
    storage: "Simpan di freezer -18°C, tutup rapat setelah dibuka.",
    shelfLife: "12 bulan di -18°C sejak tanggal produksi",
    thawing: "Ambil potongan yang dibutuhkan, cairkan di chiller 4 jam.",
    cookingTip: "Fish and chips, dori sambal matah, atau steam jahe.",
    origin: "Pengolah seafood bersertifikat BPOM, Sidoarjo",
    skuIds: ["IDF-1KG"],
    defaultSkuId: "IDF-1KG",
    soldCount: 365,
    addedAt: "2026-04-11",
    keywords: ["fish fillet", "dory", "dori", "ikan"],
  },
  {
    id: "udang-kupas",
    slug: "udang-kupas-500g",
    name: "Udang Kupas",
    category: "seafood",
    icon: "shrimp",
    tagline: "Udang vaname kupas ekor, ukuran 41–50 per 500 g",
    description:
      "Udang vaname dikupas dengan ekor tersisa, sudah dibuang kotorannya. Dibekukan dengan lapisan es tipis (glazing ≤10%) untuk menjaga tekstur.",
    highlights: ["Kupas, sisa ekor", "Size 41–50 / 500 g", "Glazing ≤10%"],
    storage: "Simpan di freezer -18°C.",
    shelfLife: "12 bulan di -18°C sejak tanggal produksi",
    thawing: "Bilas di air mengalir 5–10 menit, tiriskan sebelum dimasak.",
    cookingTip: "Udang saus mentega, tempura, atau campuran nasi goreng.",
    origin: "Tambak & pengolah bersertifikat BPOM, Lampung",
    skuIds: ["UDK-500"],
    defaultSkuId: "UDK-500",
    soldCount: 298,
    addedAt: "2026-05-20",
    keywords: ["frozen shrimp", "udang", "prawn", "vaname"],
  },
  {
    id: "nugget-ayam",
    slug: "nugget-ayam-500g",
    name: "Nugget Ayam",
    category: "olahan",
    icon: "popcorn",
    tagline: "Daging ayam 60%, tanpa pengawet tambahan",
    description:
      "Nugget dari daging ayam 60% dengan lapisan tepung roti renyah. Bisa digoreng langsung dari beku, tanpa perlu dicairkan.",
    highlights: ["Daging ayam 60%", "Goreng langsung dari beku", "±28 pcs per pack"],
    storage: "Simpan di freezer -18°C.",
    shelfLife: "12 bulan di -18°C sejak tanggal produksi",
    thawing: "Tidak perlu dicairkan. Goreng 3–4 menit di minyak 170°C.",
    cookingTip: "Air fryer 180°C selama 10 menit, balik di menit ke-5.",
    origin: "Produsen olahan bersertifikat Halal & BPOM, Tangerang",
    skuIds: ["NGA-500"],
    defaultSkuId: "NGA-500",
    soldCount: 940,
    addedAt: "2026-03-02",
    keywords: ["nuggets", "chicken nugget", "nugget"],
  },
  {
    id: "kentang-french-fries",
    slug: "kentang-french-fries-1kg",
    name: "Kentang French Fries",
    category: "sayur",
    icon: "wheat",
    tagline: "Potongan shoestring 7 mm, renyah di air fryer",
    description:
      "Kentang potong shoestring 7 mm yang sudah di-blanching dan dibekukan. Renyah di luar, lembut di dalam.",
    highlights: ["Shoestring 7 mm", "Sudah blanching", "Cocok untuk air fryer"],
    storage: "Simpan di freezer -18°C, tutup rapat setelah dibuka.",
    shelfLife: "18 bulan di -18°C sejak tanggal produksi",
    thawing: "Tidak perlu dicairkan. Langsung goreng atau air fryer.",
    cookingTip: "Air fryer 200°C 12–15 menit, kocok wadah tiap 5 menit.",
    origin: "Importir resmi terdaftar BPOM, Jakarta",
    skuIds: ["KFF-1KG"],
    defaultSkuId: "KFF-1KG",
    soldCount: 610,
    addedAt: "2026-03-15",
    keywords: ["french fries", "kentang goreng", "fries"],
  },
  {
    id: "bakso-sapi",
    slug: "bakso-sapi-500g",
    name: "Bakso Sapi",
    category: "olahan",
    icon: "soup",
    tagline: "Bakso urat halus, ±25 butir per pack",
    description:
      "Bakso sapi dengan campuran urat halus, kenyal dan gurih. Tinggal rebus atau masukkan ke kuah.",
    highlights: ["Urat halus", "±25 butir / 500 g", "Tanpa boraks"],
    storage: "Simpan di freezer -18°C.",
    shelfLife: "6 bulan di -18°C sejak tanggal produksi",
    thawing: "Tidak perlu dicairkan. Rebus langsung 5–7 menit.",
    cookingTip: "Bakso kuah, bakso bakar, atau campuran mi goreng.",
    origin: "Produsen olahan bersertifikat Halal & BPOM, Bekasi",
    skuIds: ["BKS-500"],
    defaultSkuId: "BKS-500",
    soldCount: 505,
    addedAt: "2026-03-15",
    keywords: ["meatballs", "bakso", "beef ball"],
  },
  {
    id: "edamame",
    slug: "edamame-500g",
    name: "Edamame",
    category: "sayur",
    icon: "bean",
    tagline: "Kedelai jepang berkulit, sudah direbus setengah matang",
    description:
      "Edamame utuh berkulit dari Jember, sudah direbus setengah matang lalu dibekukan. Camilan sehat siap dalam 5 menit.",
    highlights: ["Polong utuh", "Setengah matang", "Petani mitra Jember"],
    storage: "Simpan di freezer -18°C.",
    shelfLife: "12 bulan di -18°C sejak tanggal produksi",
    thawing: "Tidak perlu dicairkan. Rebus 3–5 menit atau kukus.",
    cookingTip: "Taburi garam laut dan bawang putih goreng.",
    origin: "Petani mitra & pengolah bersertifikat BPOM, Jember",
    skuIds: ["EDM-500"],
    defaultSkuId: "EDM-500",
    soldCount: 388,
    addedAt: "2026-06-01",
    keywords: ["edamame", "kedelai", "soybean"],
  },
  {
    id: "ayam-utuh",
    slug: "ayam-utuh-per-kg",
    name: "Ayam Utuh",
    category: "ayam",
    icon: "drumstick",
    tagline: "Karkas broiler ±1,0–1,3 kg per ekor, dijual timbang",
    description:
      "Ayam broiler utuh tanpa jeroan. Dijual per kg dan ditimbang saat packing; selisih timbang di atas 50 g dikembalikan sebagai saldo.",
    highlights: ["Dijual timbang", "Tanpa jeroan", "Bisa dipotong 4 / 8 (gratis)"],
    storage: "Simpan di freezer -18°C.",
    shelfLife: "9 bulan di -18°C sejak tanggal produksi",
    thawing: "Chiller 12–18 jam sebelum dimasak.",
    cookingTip: "Opor, ayam bakar, atau kaldu ayam rumahan.",
    origin: "Vendor unggas bersertifikat Halal, Bogor",
    skuIds: ["AYU-KG"],
    defaultSkuId: "AYU-KG",
    variants: [
      { id: "utuh", label: "Utuh", note: "1 ekor tidak dipotong" },
      { id: "potong-4", label: "Potong 4", note: "Paha & dada dipisah" },
      { id: "potong-8", label: "Potong 8", note: "Siap goreng / opor" },
    ],
    soldCount: 276,
    addedAt: "2026-04-01",
    keywords: ["whole chicken", "ayam broiler", "karkas"],
  },
];

/** Bundling hemat — asumsi: harga paket ditetapkan owner */
export const BUNDLES = [
  {
    id: "stok-seminggu",
    name: "Paket Stok Seminggu",
    blurb: "Lauk & camilan untuk 2–3 orang selama seminggu.",
    items: [
      { skuId: "AYF-500", qty: 2 },
      { skuId: "NGA-500", qty: 1 },
      { skuId: "KFF-1KG", qty: 1 },
      { skuId: "EDM-500", qty: 1 },
    ],
    price: 179_000,
  },
  {
    id: "seafood-akhir-pekan",
    name: "Paket Seafood Akhir Pekan",
    blurb: "Udang dan dori untuk makan bersama keluarga.",
    items: [
      { skuId: "UDK-500", qty: 1 },
      { skuId: "IDF-1KG", qty: 1 },
      { skuId: "KFF-1KG", qty: 1 },
    ],
    price: 162_000,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Pelanggan                                                           */
/* ------------------------------------------------------------------ */
export type CustomerType = "retail" | "reseller" | "b2b";

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line: string;
  city: string;
  postal: string;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  addresses: Address[];
  note?: string;
}

export const CUSTOMERS: Customer[] = [
  {
    id: "c-rani",
    name: "Rani Anggraini",
    type: "retail",
    phone: "0812-3456-7801",
    email: "rani.anggraini@contoh.id",
    addresses: [
      {
        id: "a-rani-1", label: "Rumah", recipient: "Rani Anggraini", phone: "0812-3456-7801",
        line: "Jl. Kemang Raya No. 18, Bangka, Mampang Prapatan", city: "Jakarta Selatan", postal: "12730",
      },
      {
        id: "a-rani-2", label: "Rumah orang tua", recipient: "Ibu Sri Anggraini", phone: "0813-2200-1145",
        line: "Jl. Kaliurang Km 6 No. 21, Sinduadi, Mlati", city: "Sleman", postal: "55284",
      },
    ],
  },
  {
    id: "c-sejahtera",
    name: "Toko Frozen Sejahtera",
    type: "reseller",
    phone: "0857-1122-3344",
    email: "frozensejahtera@contoh.id",
    note: "Reseller disetujui 4 Agu 2026",
    addresses: [
      {
        id: "a-sej-1", label: "Toko", recipient: "Pak Hendra", phone: "0857-1122-3344",
        line: "Ruko Galaxy Blok C No. 9, Pekayon Jaya", city: "Bekasi", postal: "17148",
      },
    ],
  },
  {
    id: "c-butini",
    name: "Warung Nasi Bu Tini",
    type: "b2b",
    phone: "0821-7788-9012",
    email: "warungbutini@contoh.id",
    addresses: [
      {
        id: "a-tini-1", label: "Dapur", recipient: "Bu Tini", phone: "0821-7788-9012",
        line: "Jl. Margonda Raya No. 211, Kemiri Muka, Beji", city: "Depok", postal: "16424",
      },
    ],
  },
  {
    id: "c-sehati",
    name: "Katering Sehati",
    type: "b2b",
    phone: "0822-4410-5566",
    email: "kateringsehati@contoh.id",
    addresses: [
      {
        id: "a-seh-1", label: "Dapur produksi", recipient: "Ibu Maya", phone: "0822-4410-5566",
        line: "Jl. Burangrang No. 34, Lengkong", city: "Bandung", postal: "40262",
      },
    ],
  },
  {
    id: "c-dimas", name: "Dimas Pratama", type: "retail", phone: "0815-9001-2233", email: "dimas.p@contoh.id",
    addresses: [{ id: "a-dim-1", label: "Rumah", recipient: "Dimas Pratama", phone: "0815-9001-2233", line: "Jl. Pandanaran No. 70, Mugassari", city: "Semarang", postal: "50249" }],
  },
  {
    id: "c-lestari", name: "Lestari Wulandari", type: "retail", phone: "0819-3344-1020", email: "lestari.w@contoh.id",
    addresses: [{ id: "a-les-1", label: "Rumah", recipient: "Lestari Wulandari", phone: "0819-3344-1020", line: "Jl. Tukad Badung No. 15, Renon", city: "Denpasar", postal: "80226" }],
  },
  {
    id: "c-andi", name: "Andi Saputra", type: "retail", phone: "0813-6677-8899", email: "andi.saputra@contoh.id",
    addresses: [{ id: "a-and-1", label: "Rumah", recipient: "Andi Saputra", phone: "0813-6677-8899", line: "Jl. Boulevard Gading Serpong Blok M5 No. 3", city: "Tangerang", postal: "15810" }],
  },
];

/* ------------------------------------------------------------------ */
/* Kontrak B2B                                                         */
/* ------------------------------------------------------------------ */
export type ContractStatus = "draft" | "aktif" | "selesai";

export interface ContractItem {
  skuId: string;
  price: number;
  quotaGrams: number;
  usedGrams: number;
}

export interface Contract {
  id: string;
  number: string;
  customerId: string;
  start: string;
  end: string;
  termDays: number;
  creditLimit: number;
  status: ContractStatus;
  delivery: string;
  items: ContractItem[];
}

export const CONTRACTS: Contract[] = [
  {
    id: "k-tini-2026",
    number: "KTR-2026-004",
    customerId: "c-butini",
    start: "2026-01-01",
    end: "2026-12-31",
    termDays: 14,
    creditLimit: 5_000_000,
    status: "aktif",
    delivery: "Armada U-Frost, Senin & Kamis pagi",
    items: [
      { skuId: "AYF-500", price: 44_000, quotaGrams: 1_000_000, usedGrams: 950_000 },
      { skuId: "KFF-1KG", price: 35_000, quotaGrams: 600_000, usedGrams: 320_000 },
      { skuId: "NGA-500", price: 29_500, quotaGrams: 300_000, usedGrams: 140_000 },
    ],
  },
  {
    id: "k-sehati-2026",
    number: "KTR-2026-007",
    customerId: "c-sehati",
    start: "2026-07-01",
    end: "2027-06-30",
    termDays: 30,
    creditLimit: 8_000_000,
    status: "aktif",
    delivery: "Kurir berpendingin rekanan, Selasa",
    items: [
      { skuId: "IDF-1KG", price: 54_000, quotaGrams: 400_000, usedGrams: 180_000 },
      { skuId: "DSG-500", price: 61_000, quotaGrams: 250_000, usedGrams: 96_000 },
      { skuId: "EDM-500", price: 23_500, quotaGrams: 150_000, usedGrams: 60_000 },
    ],
  },
  {
    id: "k-tini-2025",
    number: "KTR-2025-002",
    customerId: "c-butini",
    start: "2025-01-01",
    end: "2025-12-31",
    termDays: 14,
    creditLimit: 4_000_000,
    status: "selesai",
    delivery: "Armada U-Frost, Senin & Kamis pagi",
    items: [
      { skuId: "AYF-500", price: 42_500, quotaGrams: 900_000, usedGrams: 900_000 },
      { skuId: "KFF-1KG", price: 34_000, quotaGrams: 400_000, usedGrams: 386_000 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Order (seed) — total, berat & ongkir dihitung di lib/seed.ts         */
/* ------------------------------------------------------------------ */
export type OrderStatus =
  | "menunggu_pembayaran"
  | "dibayar"
  | "diproses"
  | "siap_kirim"
  | "dikirim"
  | "selesai"
  | "klaim"
  | "refund"
  | "dibatalkan";

export type PaymentStatus = "belum" | "menunggu_verifikasi" | "terverifikasi" | "tempo";

export interface SeedOrder {
  number: string;
  customerId: string;
  addressId: string;
  channel: "web" | "manual";
  contractId?: string;
  status: OrderStatus;
  payment: PaymentStatus;
  proofName?: string;
  createdAt: string;
  shipDate: string;
  /** jam relatif ke "sekarang" untuk diterima (dipakai demo klaim 6 jam) */
  deliveredHoursAgo?: number;
  deliveredAt?: string;
  awb?: string;
  items: { skuId: string; qty: number; variantId?: string }[];
  history: { status: OrderStatus; at: string; note?: string }[];
}

const COURIER_AWB = (n: string) => `UFX${n}`;

export const SEED_ORDERS: SeedOrder[] = [
  {
    number: "UF-261125-004", customerId: "c-rani", addressId: "a-rani-1", channel: "web",
    status: "menunggu_pembayaran", payment: "menunggu_verifikasi", proofName: "bukti-transfer-rani.jpg",
    createdAt: "2026-11-25T09:12:00+07:00", shipDate: "2026-11-25",
    items: [{ skuId: "AYF-500", qty: 2 }, { skuId: "EDM-500", qty: 2 }, { skuId: "NGA-500", qty: 1 }],
    history: [{ status: "menunggu_pembayaran", at: "2026-11-25T09:12:00+07:00", note: "Bukti transfer diunggah 09.31" }],
  },
  {
    number: "UF-261125-003", customerId: "c-sejahtera", addressId: "a-sej-1", channel: "web",
    status: "menunggu_pembayaran", payment: "menunggu_verifikasi", proofName: "trf-sejahtera-2511.pdf",
    createdAt: "2026-11-25T10:40:00+07:00", shipDate: "2026-11-25",
    items: [{ skuId: "NGA-500", qty: 10 }, { skuId: "KFF-1KG", qty: 6 }, { skuId: "AYF-KRT", qty: 1 }],
    history: [{ status: "menunggu_pembayaran", at: "2026-11-25T10:40:00+07:00", note: "Bukti transfer diunggah 10.52" }],
  },
  {
    number: "UF-261125-002", customerId: "c-butini", addressId: "a-tini-1", channel: "manual", contractId: "k-tini-2026",
    status: "diproses", payment: "tempo", createdAt: "2026-11-25T08:05:00+07:00", shipDate: "2026-11-26",
    items: [{ skuId: "AYF-500", qty: 20 }, { skuId: "NGA-500", qty: 6 }],
    history: [
      { status: "diproses", at: "2026-11-25T08:05:00+07:00", note: "Call-off KTR-2026-004 dibuat admin" },
    ],
  },
  {
    number: "UF-261125-001", customerId: "c-rani", addressId: "a-rani-1", channel: "web",
    status: "selesai", payment: "terverifikasi", createdAt: "2026-11-24T13:20:00+07:00", shipDate: "2026-11-24",
    deliveredHoursAgo: 2, awb: COURIER_AWB("2411240031"),
    items: [{ skuId: "UDK-500", qty: 1 }, { skuId: "IDF-1KG", qty: 1 }, { skuId: "KFF-1KG", qty: 1 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-24T13:20:00+07:00" },
      { status: "dibayar", at: "2026-11-24T13:41:00+07:00", note: "Transfer BCA Rp 196.000 cocok" },
      { status: "diproses", at: "2026-11-24T14:30:00+07:00" },
      { status: "siap_kirim", at: "2026-11-24T16:05:00+07:00" },
      { status: "dikirim", at: "2026-11-24T17:20:00+07:00" },
    ],
  },
  {
    number: "UF-261124-005", customerId: "c-dimas", addressId: "a-dim-1", channel: "web",
    status: "siap_kirim", payment: "terverifikasi", createdAt: "2026-11-24T16:10:00+07:00", shipDate: "2026-11-25",
    items: [{ skuId: "AYU-KG", qty: 2.5, variantId: "potong-8" }, { skuId: "DSG-500", qty: 1 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-24T16:10:00+07:00" },
      { status: "dibayar", at: "2026-11-24T19:02:00+07:00" },
      { status: "diproses", at: "2026-11-25T08:30:00+07:00" },
      { status: "siap_kirim", at: "2026-11-25T11:15:00+07:00", note: "Timbang aktual 2,52 kg" },
    ],
  },
  {
    number: "UF-261124-004", customerId: "c-sejahtera", addressId: "a-sej-1", channel: "web",
    status: "dikirim", payment: "terverifikasi", createdAt: "2026-11-24T09:30:00+07:00", shipDate: "2026-11-24",
    awb: COURIER_AWB("2411240027"),
    items: [{ skuId: "EDM-500", qty: 12 }, { skuId: "NGA-500", qty: 12 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-24T09:30:00+07:00" },
      { status: "dibayar", at: "2026-11-24T09:58:00+07:00" },
      { status: "diproses", at: "2026-11-24T10:30:00+07:00" },
      { status: "siap_kirim", at: "2026-11-24T13:10:00+07:00" },
      { status: "dikirim", at: "2026-11-24T15:40:00+07:00" },
    ],
  },
  {
    number: "UF-261124-003", customerId: "c-butini", addressId: "a-tini-1", channel: "manual", contractId: "k-tini-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-11-23T15:00:00+07:00", shipDate: "2026-11-24",
    deliveredAt: "2026-11-24T08:10:00+07:00",
    items: [{ skuId: "AYF-500", qty: 24 }, { skuId: "KFF-1KG", qty: 8 }],
    history: [
      { status: "diproses", at: "2026-11-23T15:00:00+07:00" },
      { status: "siap_kirim", at: "2026-11-24T06:30:00+07:00" },
      { status: "dikirim", at: "2026-11-24T07:00:00+07:00", note: "Invoice INV-2026-0052 terbit" },
      { status: "selesai", at: "2026-11-24T08:10:00+07:00" },
    ],
  },
  {
    number: "UF-261123-002", customerId: "c-lestari", addressId: "a-les-1", channel: "web",
    status: "dibatalkan", payment: "belum", createdAt: "2026-11-23T11:05:00+07:00", shipDate: "2026-11-23",
    items: [{ skuId: "UDK-500", qty: 2 }, { skuId: "IDF-1KG", qty: 1 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-23T11:05:00+07:00" },
      { status: "dibatalkan", at: "2026-11-24T11:05:00+07:00", note: "Otomatis: tidak dibayar dalam 24 jam" },
    ],
  },
  {
    number: "UF-261121-002", customerId: "c-andi", addressId: "a-and-1", channel: "web",
    status: "klaim", payment: "terverifikasi", createdAt: "2026-11-20T10:00:00+07:00", shipDate: "2026-11-20",
    deliveredAt: "2026-11-21T10:20:00+07:00", awb: COURIER_AWB("2011200012"),
    items: [{ skuId: "AYF-500", qty: 4 }, { skuId: "BKS-500", qty: 2 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-20T10:00:00+07:00" },
      { status: "dibayar", at: "2026-11-20T10:25:00+07:00" },
      { status: "diproses", at: "2026-11-20T11:00:00+07:00" },
      { status: "siap_kirim", at: "2026-11-20T13:30:00+07:00" },
      { status: "dikirim", at: "2026-11-20T16:00:00+07:00" },
      { status: "selesai", at: "2026-11-21T10:20:00+07:00" },
      { status: "klaim", at: "2026-11-21T12:05:00+07:00", note: "2 pack ayam fillet tiba lembek" },
    ],
  },
  {
    number: "UF-261120-001", customerId: "c-butini", addressId: "a-tini-1", channel: "manual", contractId: "k-tini-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-11-19T15:00:00+07:00", shipDate: "2026-11-20",
    deliveredAt: "2026-11-20T08:05:00+07:00",
    items: [{ skuId: "AYF-500", qty: 20 }, { skuId: "NGA-500", qty: 10 }],
    history: [
      { status: "diproses", at: "2026-11-19T15:00:00+07:00" },
      { status: "dikirim", at: "2026-11-20T07:00:00+07:00", note: "Invoice INV-2026-0049 terbit" },
      { status: "selesai", at: "2026-11-20T08:05:00+07:00" },
    ],
  },
  {
    number: "UF-261118-002", customerId: "c-rani", addressId: "a-rani-1", channel: "web",
    status: "selesai", payment: "terverifikasi", createdAt: "2026-11-18T08:40:00+07:00", shipDate: "2026-11-18",
    deliveredAt: "2026-11-19T11:30:00+07:00", awb: COURIER_AWB("1811180009"),
    items: [{ skuId: "AYF-500", qty: 2 }, { skuId: "DSG-500", qty: 1 }, { skuId: "KFF-1KG", qty: 1 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-18T08:40:00+07:00" },
      { status: "dibayar", at: "2026-11-18T09:05:00+07:00" },
      { status: "diproses", at: "2026-11-18T10:00:00+07:00" },
      { status: "siap_kirim", at: "2026-11-18T13:00:00+07:00" },
      { status: "dikirim", at: "2026-11-18T16:30:00+07:00" },
      { status: "selesai", at: "2026-11-19T11:30:00+07:00" },
    ],
  },
  {
    number: "UF-261122-001", customerId: "c-sehati", addressId: "a-seh-1", channel: "manual", contractId: "k-sehati-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-11-21T14:00:00+07:00", shipDate: "2026-11-22",
    deliveredAt: "2026-11-23T09:40:00+07:00",
    items: [{ skuId: "IDF-1KG", qty: 25 }],
    history: [
      { status: "diproses", at: "2026-11-21T14:00:00+07:00" },
      { status: "dikirim", at: "2026-11-22T15:00:00+07:00", note: "Invoice INV-2026-0051 terbit" },
      { status: "selesai", at: "2026-11-23T09:40:00+07:00" },
    ],
  },
  {
    number: "UF-261113-001", customerId: "c-butini", addressId: "a-tini-1", channel: "manual", contractId: "k-tini-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-11-12T15:00:00+07:00", shipDate: "2026-11-13",
    deliveredAt: "2026-11-13T08:00:00+07:00",
    items: [{ skuId: "AYF-500", qty: 24 }, { skuId: "KFF-1KG", qty: 12 }],
    history: [
      { status: "diproses", at: "2026-11-12T15:00:00+07:00" },
      { status: "dikirim", at: "2026-11-13T07:00:00+07:00", note: "Invoice INV-2026-0046 terbit" },
      { status: "selesai", at: "2026-11-13T08:00:00+07:00" },
    ],
  },
  {
    number: "UF-261109-001", customerId: "c-rani", addressId: "a-rani-1", channel: "web",
    status: "selesai", payment: "terverifikasi", createdAt: "2026-11-09T19:15:00+07:00", shipDate: "2026-11-10",
    deliveredAt: "2026-11-11T10:00:00+07:00", awb: COURIER_AWB("1011100004"),
    items: [{ skuId: "NGA-500", qty: 2 }, { skuId: "EDM-500", qty: 2 }, { skuId: "KFF-1KG", qty: 1 }],
    history: [
      { status: "menunggu_pembayaran", at: "2026-11-09T19:15:00+07:00" },
      { status: "dibayar", at: "2026-11-09T20:00:00+07:00" },
      { status: "diproses", at: "2026-11-10T08:00:00+07:00" },
      { status: "dikirim", at: "2026-11-10T16:00:00+07:00" },
      { status: "selesai", at: "2026-11-11T10:00:00+07:00" },
    ],
  },
  {
    number: "UF-261014-001", customerId: "c-sehati", addressId: "a-seh-1", channel: "manual", contractId: "k-sehati-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-10-13T14:00:00+07:00", shipDate: "2026-10-14",
    deliveredAt: "2026-10-15T09:00:00+07:00",
    items: [{ skuId: "IDF-1KG", qty: 30 }, { skuId: "DSG-500", qty: 10 }],
    history: [
      { status: "diproses", at: "2026-10-13T14:00:00+07:00" },
      { status: "dikirim", at: "2026-10-14T15:00:00+07:00", note: "Invoice INV-2026-0038 terbit" },
      { status: "selesai", at: "2026-10-15T09:00:00+07:00" },
    ],
  },
  {
    number: "UF-260920-001", customerId: "c-sehati", addressId: "a-seh-1", channel: "manual", contractId: "k-sehati-2026",
    status: "selesai", payment: "tempo", createdAt: "2026-09-19T14:00:00+07:00", shipDate: "2026-09-20",
    deliveredAt: "2026-09-21T09:00:00+07:00",
    items: [{ skuId: "IDF-1KG", qty: 20 }, { skuId: "EDM-500", qty: 20 }],
    history: [
      { status: "diproses", at: "2026-09-19T14:00:00+07:00" },
      { status: "dikirim", at: "2026-09-20T15:00:00+07:00", note: "Invoice INV-2026-0029 terbit" },
      { status: "selesai", at: "2026-09-21T09:00:00+07:00" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Invoice B2B (total diambil dari order terkait)                     */
/* ------------------------------------------------------------------ */
export interface SeedInvoice {
  number: string;
  orderNumber: string;
  issuedAt: string;
  payments: { at: string; amount: number; method: "transfer" | "tunai" }[];
}

export const SEED_INVOICES: SeedInvoice[] = [
  { number: "INV-2026-0029", orderNumber: "UF-260920-001", issuedAt: "2026-09-20", payments: [{ at: "2026-10-19", amount: 1_100_000, method: "transfer" }] },
  { number: "INV-2026-0038", orderNumber: "UF-261014-001", issuedAt: "2026-10-14", payments: [] },
  { number: "INV-2026-0046", orderNumber: "UF-261113-001", issuedAt: "2026-11-13", payments: [{ at: "2026-11-20", amount: 600_000, method: "transfer" }, { at: "2026-11-24", amount: 876_000, method: "transfer" }] },
  { number: "INV-2026-0049", orderNumber: "UF-261120-001", issuedAt: "2026-11-20", payments: [{ at: "2026-11-25", amount: 400_000, method: "tunai" }] },
  { number: "INV-2026-0051", orderNumber: "UF-261122-001", issuedAt: "2026-11-22", payments: [] },
  { number: "INV-2026-0052", orderNumber: "UF-261124-003", issuedAt: "2026-11-24", payments: [] },
];

/* ------------------------------------------------------------------ */
/* Klaim retur                                                         */
/* ------------------------------------------------------------------ */
export type ClaimReason = "thaw" | "salah_kirim" | "kurang_qty" | "tidak_sesuai";
export type ClaimResolution = "refund" | "ganti";
export type ClaimStatus = "diajukan" | "disetujui" | "ditolak";

export const CLAIM_REASONS: { id: ClaimReason; label: string; hint: string }[] = [
  { id: "thaw", label: "Tiba tidak beku / rusak", hint: "Produk lembek, kemasan bocor, atau ice gel sudah cair" },
  { id: "salah_kirim", label: "Salah kirim", hint: "Produk atau varian berbeda dari pesanan" },
  { id: "kurang_qty", label: "Jumlah kurang", hint: "Jumlah pack/berat kurang dari pesanan" },
  { id: "tidak_sesuai", label: "Tidak sesuai deskripsi", hint: "Ukuran, potongan, atau kualitas tidak sesuai" },
];

export interface SeedClaim {
  id: string;
  orderNumber: string;
  createdAt: string;
  reason: ClaimReason;
  items: { skuId: string; qty: number }[];
  photos: string[];
  preferred: ClaimResolution;
  note: string;
  status: ClaimStatus;
}

export const SEED_CLAIMS: SeedClaim[] = [
  {
    id: "KLM-2026-0012",
    orderNumber: "UF-261121-002",
    createdAt: "2026-11-21T12:05:00+07:00",
    reason: "thaw",
    items: [{ skuId: "AYF-500", qty: 2 }],
    photos: ["ayam-lembek-1.jpg", "label-terima.jpg", "kemasan-box.jpg"],
    preferred: "ganti",
    note: "Dua pack paling atas sudah lembek, ice gel tinggal satu yang masih beku.",
    status: "diajukan",
  },
];

/* ------------------------------------------------------------------ */
/* Kas, biaya & penjualan agregat (untuk laporan)                       */
/* ------------------------------------------------------------------ */
export interface CashEntry {
  id: string;
  date: string;
  time: string;
  direction: "in" | "out";
  category: "transfer" | "tunai" | "supplier" | "operasional" | "refund";
  description: string;
  ref: string;
  amount: number;
}

export const OPENING_CASH: Record<string, number> = {
  "2026-11-24": 17_620_000,
};

export const SEED_CASH: CashEntry[] = [
  { id: "cs-01", date: "2026-11-24", time: "09:58", direction: "in", category: "transfer", description: "Transfer Toko Frozen Sejahtera", ref: "UF-261124-004", amount: 704_000 },
  { id: "cs-02", date: "2026-11-24", time: "10:40", direction: "out", category: "operasional", description: "Ice gel 60 pcs & box styrofoam 20 pcs", ref: "BIAYA-1124-01", amount: 410_000 },
  { id: "cs-03", date: "2026-11-24", time: "13:41", direction: "in", category: "transfer", description: "Transfer Rani Anggraini", ref: "UF-261125-001", amount: 196_000 },
  { id: "cs-04", date: "2026-11-24", time: "14:15", direction: "in", category: "transfer", description: "Pelunasan INV-2026-0046 · Warung Nasi Bu Tini", ref: "INV-2026-0046", amount: 876_000 },
  { id: "cs-05", date: "2026-11-24", time: "15:30", direction: "out", category: "refund", description: "Refund klaim KLM-2026-0010 (udang tiba lembek)", ref: "KLM-2026-0010", amount: 75_000 },
  { id: "cs-06", date: "2026-11-24", time: "19:02", direction: "in", category: "transfer", description: "Transfer Dimas Pratama", ref: "UF-261124-005", amount: 0 },
  { id: "cs-07", date: "2026-11-25", time: "08:20", direction: "out", category: "supplier", description: "Bayar PO-2026-031 · CV Unggas Prima (60 pack fillet)", ref: "PO-2026-031", amount: 2_280_000 },
  { id: "cs-08", date: "2026-11-25", time: "09:10", direction: "in", category: "tunai", description: "Cicilan INV-2026-0049 · Warung Nasi Bu Tini", ref: "INV-2026-0049", amount: 400_000 },
  { id: "cs-09", date: "2026-11-25", time: "11:00", direction: "out", category: "operasional", description: "Ongkir kurir berpendingin batch pagi", ref: "BIAYA-1125-01", amount: 185_000 },
];

/** Penjualan 1–25 Nov 2026 per SKU & kanal (unit satuan jual) */
export const NOV_SALES: { skuId: string; retail: number; reseller: number; kontrak: number }[] = [
  { skuId: "AYF-500", retail: 180, reseller: 120, kontrak: 260 },
  { skuId: "AYF-KRT", retail: 6, reseller: 9, kontrak: 0 },
  { skuId: "DSG-500", retail: 70, reseller: 40, kontrak: 30 },
  { skuId: "IDF-1KG", retail: 45, reseller: 30, kontrak: 75 },
  { skuId: "UDK-500", retail: 38, reseller: 20, kontrak: 0 },
  { skuId: "NGA-500", retail: 150, reseller: 140, kontrak: 36 },
  { skuId: "KFF-1KG", retail: 90, reseller: 60, kontrak: 60 },
  { skuId: "BKS-500", retail: 60, reseller: 45, kontrak: 0 },
  { skuId: "EDM-500", retail: 70, reseller: 50, kontrak: 20 },
  { skuId: "AYU-KG", retail: 120, reseller: 60, kontrak: 0 },
];

/** Biaya operasional 1–25 Nov 2026 */
export const NOV_OPEX: { label: string; amount: number }[] = [
  { label: "Selisih ongkir ditanggung toko", amount: 1_150_000 },
  { label: "Packing, box insulated & ice gel", amount: 2_400_000 },
  { label: "Gaji admin & packer", amount: 5_500_000 },
  { label: "Sewa & listrik freezer", amount: 2_100_000 },
  { label: "Marketing & foto produk", amount: 900_000 },
];

export const NOV_DISCOUNTS = 1_380_000;

/* Opname terakhir & penerimaan (kartu stok) */
export const LAST_OPNAME_DATE = "2026-11-22";
export const OPNAME_DIFF: Record<string, number> = {
  "AYF-500": -1,
  "UDK-500": -1,
  "AYU-KG": -0.5,
};

export const SUPPLIERS = [
  { id: "sup-unggas", name: "CV Unggas Prima", skus: ["AYF-500", "AYF-KRT", "AYU-KG"] },
  { id: "sup-daging", name: "PT Sapi Nusantara Pangan", skus: ["DSG-500", "BKS-500"] },
  { id: "sup-laut", name: "UD Bahari Beku", skus: ["IDF-1KG", "UDK-500"] },
  { id: "sup-olahan", name: "PT Olahan Rasa Mandiri", skus: ["NGA-500", "KFF-1KG", "EDM-500"] },
];
