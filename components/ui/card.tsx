import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-none border border-border bg-surface shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center justify-between", className)}>
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {action}
    </div>
  );
}
