import { cn } from "@/lib/utils";

export type ProductKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const DOT_CLASS: Record<ProductKey, string> = {
  golms: "bg-golms",
  golxp: "bg-golxp",
  gocatalog: "bg-gocatalog-raw",
  gofactory: "bg-gofactory-raw",
  gotools: "bg-gotools-raw",
};

const TEXT_CLASS: Record<ProductKey, string> = {
  golms: "text-golms",
  golxp: "text-golxp",
  gocatalog: "text-gocatalog",
  gofactory: "text-gofactory",
  gotools: "text-gotools",
};

export function ProductTag({ product }: { product: ProductKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold",
        TEXT_CLASS[product]
      )}
    >
      <i className={cn("inline-block h-1.5 w-1.5 rounded-full", DOT_CLASS[product])} />
      {PRODUCT_LABEL[product]}
    </span>
  );
}
