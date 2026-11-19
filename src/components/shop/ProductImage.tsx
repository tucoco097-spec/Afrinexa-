import { Package } from "lucide-react";
import { useImageUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function ProductImage({
  path,
  alt,
  className,
}: {
  path?: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useImageUrl(path);
  if (!url)
    return (
      <div className={cn("grid place-items-center bg-secondary text-muted-foreground", className)}>
        <Package className="size-8" />
      </div>
    );
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
