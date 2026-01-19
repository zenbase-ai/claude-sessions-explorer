interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
