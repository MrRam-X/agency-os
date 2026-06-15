export default function BoardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-zinc-200 rounded-md"></div>
          <div className="h-4 w-48 bg-zinc-100 rounded-md"></div>
        </div>
        <div className="h-8 w-32 bg-zinc-200 rounded-md"></div>
      </div>

      {/* Swimlanes Skeleton */}
      <div className="space-y-6">
        {[1, 2].map((lane) => (
          <div key={lane} className="border border-zinc-200 rounded-lg p-4 bg-white space-y-4">
            {/* Swimlane Title */}
            <div className="h-5 w-1/3 bg-zinc-100 rounded-md"></div>
            
            {/* Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="bg-zinc-50 rounded-lg p-3 min-h-[150px] space-y-3">
                  <div className="h-4 w-16 bg-zinc-200 rounded-md"></div>
                  <div className="h-20 bg-white rounded-md border border-zinc-200"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}