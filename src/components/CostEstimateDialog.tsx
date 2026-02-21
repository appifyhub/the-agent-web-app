import React from "react";
import { Info, X } from "lucide-react";
import { t } from "@/lib/translations";
import { CostEstimate } from "@/services/external-tools-service";
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
import ProviderIcon from "@/components/ProviderIcon";

// ... imports

interface CostEstimateDialogProps {
  toolName: string;
  costEstimate: CostEstimate;
  providerId?: string;
  providerName?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CostEstimateContent: React.FC<{
  toolName: string;
  costEstimate: CostEstimate;
}> = ({ toolName, costEstimate }) => {
  const formatCost = (value: number): string => {
    return value.toFixed(value % 1 === 0 ? 0 : 2);
  };

  const tokenCosts = [
    {
      key: "input_1m_tokens",
      label: t("cost_estimate.input_tokens"),
      value: costEstimate.input_1m_tokens,
    },
    {
      key: "output_1m_tokens",
      label: t("cost_estimate.output_tokens"),
      value: costEstimate.output_1m_tokens,
    },
    {
      key: "search_1m_tokens",
      label: t("cost_estimate.search_tokens"),
      value: costEstimate.search_1m_tokens,
    },
  ].filter((item) => item.value != null);

  const inputImageCosts = [
    {
      key: "input_image_1k",
      label: t("cost_estimate.input_image_1k"),
      value: costEstimate.input_image_1k,
    },
    {
      key: "input_image_2k",
      label: t("cost_estimate.input_image_2k"),
      value: costEstimate.input_image_2k,
    },
    {
      key: "input_image_4k",
      label: t("cost_estimate.input_image_4k"),
      value: costEstimate.input_image_4k,
    },
    {
      key: "input_image_8k",
      label: t("cost_estimate.input_image_8k"),
      value: costEstimate.input_image_8k,
    },
    {
      key: "input_image_12k",
      label: t("cost_estimate.input_image_12k"),
      value: costEstimate.input_image_12k,
    },
  ].filter((item) => item.value != null);

  const outputImageCosts = [
    {
      key: "output_image_1k",
      label: t("cost_estimate.output_image_1k"),
      value: costEstimate.output_image_1k,
    },
    {
      key: "output_image_2k",
      label: t("cost_estimate.output_image_2k"),
      value: costEstimate.output_image_2k,
    },
    {
      key: "output_image_4k",
      label: t("cost_estimate.output_image_4k"),
      value: costEstimate.output_image_4k,
    },
  ].filter((item) => item.value != null);

  const otherCosts = [
    {
      key: "api_call",
      label: t("cost_estimate.api_call"),
      value: costEstimate.api_call,
    },
    {
      key: "second_of_runtime",
      label: t("cost_estimate.second_of_runtime"),
      value: costEstimate.second_of_runtime,
    },
  ].filter((item) => item.value != null);

  const hasAnyCosts =
    tokenCosts.length > 0 ||
    inputImageCosts.length > 0 ||
    outputImageCosts.length > 0 ||
    otherCosts.length > 0;

  return (
    <div className="space-y-8 mt-[1rem]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("cost_estimate.description", { toolName })}
        </p>
        <p className="text-xs text-muted-foreground/70 italic">
          {t("cost_estimate.disclaimer")}
        </p>
      </div>

      {!hasAnyCosts && (
        <p className="text-sm text-muted-foreground italic">
          {t("cost_estimate.no_data")}
        </p>
      )}

      {tokenCosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300 uppercase">
            {t("cost_estimate.token_costs")}
          </h4>
          <div className="space-y-1">
            {tokenCosts.map((item) => (
              <div
                key={item.key}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatCost(item.value!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inputImageCosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300/80 uppercase">
            {t("cost_estimate.input_image_costs")}
          </h4>
          <div className="space-y-1">
            {inputImageCosts.map((item) => (
              <div
                key={item.key}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatCost(item.value!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {outputImageCosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300/80 uppercase">
            {t("cost_estimate.output_image_costs")}
          </h4>
          <div className="space-y-1">
            {outputImageCosts.map((item) => (
              <div
                key={item.key}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatCost(item.value!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherCosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300/80 uppercase">
            {t("cost_estimate.other_costs")}
          </h4>
          <div className="space-y-1">
            {otherCosts.map((item) => (
              <div
                key={item.key}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatCost(item.value!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CostEstimateDialog: React.FC<CostEstimateDialogProps> = ({
  toolName,
  costEstimate,
  providerId,
  providerName,
  children,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const isControlled = open !== undefined;
  const show = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newVal: boolean) => {
    if (!isControlled) setInternalOpen(newVal);
    onOpenChange?.(newVal);
  };

  const handleClick = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenChange(true);
  };

  const trigger = isControlled && !children ? null : children ? (
    <span
      onClick={handleClick}
      onPointerDown={(e) => { e.stopPropagation(); }}
      onPointerUp={(e) => { e.stopPropagation(); }}
      onMouseDown={(e) => { e.stopPropagation(); }}
      onMouseUp={(e) => { e.stopPropagation(); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
      className="cursor-pointer inline-flex"
    >
      {children}
    </span>
  ) : (
    <button
      onClick={handleClick}
      className="p-1 hover:bg-accent/20 rounded-full transition-colors"
      type="button"
    >
      <Info className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  if (isDesktop) {
    return (
      <>
        {trigger}
        <Dialog open={show} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[500px] glass-dark-static p-[2.5rem] rounded-3xl" showCloseButton={false}>
            <DialogClose className="absolute top-8 right-8 glass rounded-full cursor-pointer h-7 w-7 flex items-center justify-center">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <DialogHeader>
              <div className="flex items-center gap-3">
                {providerId && (
                  <ProviderIcon providerId={providerId} className="w-5 h-5 opacity-80 shrink-0" />
                )}
                <DialogTitle className="text-white">{t("cost_estimate.title")}</DialogTitle>
              </div>
              {(toolName || providerName) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-accent-amber">{toolName}</span>
                  {providerName && (
                    <span className="text-sm text-accent-amber/70">· {providerName}</span>
                  )}
                </div>
              )}
            </DialogHeader>
            <CostEstimateContent toolName={toolName} costEstimate={costEstimate} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Drawer open={show} onOpenChange={handleOpenChange}>
        <DrawerContent className="glass-dark-static p-[1rem] pb-[max(2rem,env(safe-area-inset-bottom))] rounded-t-3xl">
          <DrawerHeader className="mt-[2rem]">
            <div className="flex items-center gap-3">
              {providerId && (
                <ProviderIcon providerId={providerId} className="w-5 h-5 opacity-80 shrink-0" />
              )}
              <DrawerTitle className="text-white">{t("cost_estimate.title")}</DrawerTitle>
            </div>
            {(toolName || providerName) && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-accent-amber">{toolName}</span>
                {providerName && (
                  <span className="text-sm text-accent-amber/70">· {providerName}</span>
                )}
              </div>
            )}
          </DrawerHeader>
          <CostEstimateContent toolName={toolName} costEstimate={costEstimate} />
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CostEstimateDialog;
