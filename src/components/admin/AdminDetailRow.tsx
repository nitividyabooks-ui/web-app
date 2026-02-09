interface AdminDetailRowProps {
    label: string;
    value: React.ReactNode;
}

export function AdminDetailRow({ label, value }: AdminDetailRowProps) {
    return (
        <div className="py-3 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-900 col-span-2">{value}</dd>
        </div>
    );
}
