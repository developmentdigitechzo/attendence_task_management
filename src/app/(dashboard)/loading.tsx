import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Loading Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-24 rounded-full bg-brand-100/80 skeleton-shimmer" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span>Loading module...</span>
            </div>
          </div>
          <div className="h-7 sm:h-8 w-56 sm:w-72 bg-slate-200 rounded-xl skeleton-shimmer" />
          <div className="h-3.5 w-64 sm:w-96 bg-slate-100 rounded-lg skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-xl skeleton-shimmer" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded skeleton-shimmer" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded-lg skeleton-shimmer" />
            <div className="h-3 w-32 bg-slate-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Panel Content Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-4 w-36 bg-slate-200 rounded skeleton-shimmer" />
          <div className="h-7 w-24 bg-slate-100 rounded-lg skeleton-shimmer" />
        </div>
        <div className="p-5 space-y-4">
          <div className="h-10 w-full bg-slate-50 rounded-xl border border-slate-100 skeleton-shimmer" />
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-2 border-b border-slate-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1 max-w-sm">
                    <div className="h-3.5 w-36 bg-slate-200 rounded skeleton-shimmer" />
                    <div className="h-2.5 w-48 bg-slate-100 rounded skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-3.5 w-24 bg-slate-100 rounded skeleton-shimmer hidden sm:block" />
                <div className="h-5 w-16 bg-slate-200 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
