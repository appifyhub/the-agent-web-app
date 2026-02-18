import React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { t } from "@/lib/translations";
import { PurchaseRecord } from "@/services/purchase-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PurchaseRecordCardProps {
  record: PurchaseRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSingleItem: boolean;
  locale: string;
  userId: string;
}

const PurchaseRecordCard: React.FC<PurchaseRecordCardProps> = ({
  record,
  isExpanded,
  onToggleExpand,
  isFirst,
  isLast,
  isSingleItem,
  locale,
  userId,
}) => {
  let roundedClasses = "";
  let borderClasses = "border-t-0";
  if (isSingleItem) {
    roundedClasses = "rounded-2xl";
    borderClasses = "border-t-1";
  } else if (isFirst) {
    roundedClasses = "rounded-t-2xl";
    borderClasses = "border-t-1";
  } else if (isLast) {
    roundedClasses = "rounded-b-2xl";
  }

  const formatCurrency = (cents: number): string => {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const saleDate = formatDate(record.sale_timestamp, locale);

  return (
    <div
      className={cn(
        "flex flex-col px-5 glass-muted border cursor-pointer w-full space-y-4",
        isExpanded ? "py-8" : "py-3",
        roundedClasses,
        borderClasses
      )}
      onClick={onToggleExpand}
    >
      <div className="flex items-center w-full">
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-md font-medium truncate">
              {record.product_name}
            </span>
            {record.test && (
              <Badge variant="outline" className="hidden md:flex text-xs px-1.5 py-0 shrink-0">
                {t("purchases.record.test")}
              </Badge>
            )}
            {record.is_preorder_authorization && (
              <Badge variant="outline" className="hidden md:flex text-xs px-1.5 py-0 shrink-0">
                {t("purchases.record.pre")}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground truncate">
            {saleDate}
          </span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span
            className={cn(
              "text-md font-medium",
              record.refunded
                ? "text-red-400 line-through"
                : "text-accent-amber"
            )}
          >
            {formatCurrency(record.price)}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 mb-0.5",
              isExpanded ? "text-foreground rotate-180" : "rotate-0"
            )}
          />
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="flex md:hidden items-center justify-center gap-2 pb-2">
            {record.test && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                {t("purchases.record.test")}
              </Badge>
            )}
            {record.is_preorder_authorization && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                {t("purchases.record.pre")}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-y-2 gap-x-2 md:grid md:grid-cols-2">
            <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
              <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
                {t("purchases.record.product_details")}
              </h4>
              <div className="flex flex-col space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {t("purchases.record.product_name")}
                  </span>
                  <span className="shrink-0">{record.product_name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {t("purchases.record.quantity")}
                  </span>
                  <span className="shrink-0">{record.quantity}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {record.refunded
                      ? t("purchases.record.refunded_label")
                      : record.is_preorder_authorization
                        ? t("purchases.record.preorder_label")
                        : t("purchases.record.price")}
                  </span>
                  <span className={cn("shrink-0", record.refunded && "line-through text-red-400")}>
                    {formatCurrency(record.price)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {t("purchases.record.sale_date")}
                  </span>
                  <span className="shrink-0">{saleDate}</span>
                </div>
              </div>
            </div>

            <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
              <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
                {t("purchases.record.purchase_info")}
              </h4>
              <div className="flex flex-col space-y-1 text-sm">
                {record.license_key && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                      {t("purchases.record.license_key")}
                    </span>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded break-all">
                      {record.license_key}
                    </code>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {t("purchases.record.gumroad_fee")}
                  </span>
                  <span className="shrink-0">{formatCurrency(record.gumroad_fee)}</span>
                </div>
                {record.discover_fee_charge && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("purchases.record.discover_fee")}
                    </span>
                    <span className="shrink-0">{t("always")}</span>
                  </div>
                )}
                {record.affiliate_credit_amount_cents > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("purchases.record.affiliate_credit")}
                    </span>
                    <span className="shrink-0">
                      {formatCurrency(record.affiliate_credit_amount_cents)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {record.product_permalink && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-accent-amber text-accent-amber hover:bg-accent-amber/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = new URL(record.product_permalink);
                  url.searchParams.set("user_id", userId.replace(/-/g, ""));
                  url.searchParams.set("origin", "agent_settings_buy_again");
                  window.open(url.toString(), "_blank", "noopener,noreferrer");
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t("purchases.record.buy_again")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PurchaseRecordCard;
