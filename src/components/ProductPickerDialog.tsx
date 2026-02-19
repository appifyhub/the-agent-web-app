import React from "react";
import { Coffee, ExternalLink, Infinity as InfinityIcon, PackagePlus, ShoppingCart, X } from "lucide-react";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Product } from "@/services/purchase-service";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PRODUCT_ID_PACK_100 = "MdNfIIA-QpvTVdbsmt2Y-Q==";
const PRODUCT_ID_PACK_200 = "6qh4TvbD0qz6A94Itgh1OQ==";
const PRODUCT_ID_PACK_300 = "JKSxTO8XziVzs6rB6OP0OQ==";
const PRODUCT_ID_PACK_500 = "Flvyd9RzyrGPBwF6gIc92A==";
const PRODUCT_ID_PACK_1000 = "lKIUyknbw5PB2oD_SEruLQ==";
const PRODUCT_ID_PACK_2000 = "IakAM0UnnX7KZsM_26zG4A==";
const PRODUCT_ID_PACK_3000 = "LqFFt3peqn4xjDEk2pX0Gg==";
const PRODUCT_ID_PACK_5000 = "UFnrqvu8Z_j7gv5D25zEEA==";
const PRODUCT_ID_PACK_10000 = "PRntDF9xf2fg96XhwAo03g==";
const PRODUCT_ID_DONATION = "m4Uw8SZcfYnlQouZ4Zyx4g==";

function getProductLabel(id: string, fallbackName: string): string {
  switch (id) {
    case PRODUCT_ID_PACK_100: return t("products.shop.pack_100");
    case PRODUCT_ID_PACK_200: return t("products.shop.pack_200");
    case PRODUCT_ID_PACK_300: return t("products.shop.pack_300");
    case PRODUCT_ID_PACK_500: return t("products.shop.pack_500");
    case PRODUCT_ID_PACK_1000: return t("products.shop.pack_1000");
    case PRODUCT_ID_PACK_2000: return t("products.shop.pack_2000");
    case PRODUCT_ID_PACK_3000: return t("products.shop.pack_3000");
    case PRODUCT_ID_PACK_5000: return t("products.shop.pack_5000");
    case PRODUCT_ID_PACK_10000: return t("products.shop.pack_10000");
    case PRODUCT_ID_DONATION: return t("products.shop.donation");
    default: return fallbackName;
  }
}

function getListItemClasses(index: number, total: number): string {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  if (isFirst && isLast) return "rounded-2xl border-t-1";
  if (isFirst) return "rounded-t-2xl border-t-1";
  if (isLast) return "rounded-b-2xl border-t-0";
  return "border-t-0";
}

interface ProductPickerContentProps {
  products: Product[];
  shopUrl?: string;
  onClose: () => void;
}

const ProductPickerContent: React.FC<ProductPickerContentProps> = ({ products, shopUrl, onClose }) => {
  const donationProduct = products.find((p) => p.id === PRODUCT_ID_DONATION);
  const creditPacks = products.filter((p) => p.id !== PRODUCT_ID_DONATION);

  type CtaItem = { url: string; label: string; icon: React.ReactNode; itemClassName: string };
  const ctaItems: CtaItem[] = [];
  if (donationProduct) {
    ctaItems.push({
      url: donationProduct.url,
      label: getProductLabel(donationProduct.id, donationProduct.name),
      icon: <Coffee className="h-4 w-4 shrink-0 text-teal-200" />,
      itemClassName: "glass-green",
    });
  }
  if (shopUrl) {
    ctaItems.push({
      url: shopUrl,
      label: t("products.shop.open_shop"),
      icon: <InfinityIcon className="h-4 w-4 shrink-0 text-teal-200" />,
      itemClassName: "glass-green",
    });
  }

  return (
    <div className="mt-[2rem] space-y-8">
      {ctaItems.length > 0 && (
        <div className="flex flex-col space-y-0">
          {ctaItems.map((item, index) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-5 py-4 border cursor-pointer w-full",
                getListItemClasses(index, ctaItems.length),
                item.itemClassName,
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ExternalLink className="h-4 w-4 text-teal-200 hover:text-teal-100 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}

      {creditPacks.length > 0 && (
        <>
          <h3 className="text-sm font-medium uppercase tracking-wider px-1 text-blue-300">
            {t("products.shop.credit_packs")}
          </h3>
          <div className="flex flex-col space-y-0">
            {creditPacks.map((product, index) => (
              <a
                key={product.id}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-5 py-4 glass-muted border cursor-pointer w-full",
                  getListItemClasses(index, creditPacks.length),
                )}
              >
                <div className="flex items-center gap-3">
                  <PackagePlus className="h-4 w-4 shrink-0 text-blue-300" />
                  <span className="text-sm font-medium">
                    {getProductLabel(product.id, product.name)}
                  </span>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-300 hover:text-blue-400 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface ProductPickerDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopUrl?: string;
}

const ProductPickerDialog: React.FC<ProductPickerDialogProps> = ({
  products,
  open,
  onOpenChange,
  shopUrl,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] glass-dark-static p-[2.5rem] rounded-3xl" showCloseButton={false}>
          <DialogClose className="absolute top-8 right-8 glass rounded-full cursor-pointer h-7 w-7 flex items-center justify-center">
            <X className="h-4 w-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 opacity-80 shrink-0" />
              <DialogTitle className="text-white">{t("products.shop.title")}</DialogTitle>
            </div>
          </DialogHeader>
          <ProductPickerContent products={products} shopUrl={shopUrl} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-dark-static p-[1rem] pb-[max(2rem,env(safe-area-inset-bottom))] rounded-t-3xl">
        <DrawerHeader className="mt-[2rem]">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 opacity-80 shrink-0" />
            <DrawerTitle className="text-white">{t("products.shop.title")}</DrawerTitle>
          </div>
        </DrawerHeader>
        <ProductPickerContent products={products} shopUrl={shopUrl} onClose={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
};

export default ProductPickerDialog;
