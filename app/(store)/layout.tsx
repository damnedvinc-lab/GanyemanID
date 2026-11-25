import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { StickyCartBar } from "@/components/store/sticky-cart-bar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main id="main" className="min-h-[60vh] pb-20 md:pb-0">
        {children}
      </main>
      <StoreFooter />
      <StickyCartBar />
    </>
  );
}
