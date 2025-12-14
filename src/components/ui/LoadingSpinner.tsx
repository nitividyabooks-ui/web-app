export function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" aria-label="Loading" />
                <div className="text-left">
                    <p className="font-heading text-lg font-extrabold text-slate-900">Loading…</p>
                    <p className="text-sm text-slate-600 font-medium">Just a moment.</p>
                </div>
            </div>
        </div>
    );
}
