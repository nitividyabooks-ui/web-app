import { Ruler, FileText, Weight, ShieldCheck } from "lucide-react";

interface ProductSpecsProps {
    specs: {
        dimensions_cm?: string;
        weight_g?: number;
        pages?: number;
    };
}

export function ProductSpecs({ specs }: ProductSpecsProps) {
    return (
        <div className="border-2 border-dashed border-slate-300 rounded-[24px] p-6 bg-soft/50">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Book Details</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm text-miko-blue">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Size</p>
                        <p className="font-medium text-charcoal">{specs.dimensions_cm || "15x15"} cm</p>
                        <p className="text-xs text-slate-400">Perfect for tiny hands</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm text-miko-pink">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Material</p>
                        <p className="font-medium text-charcoal">Non-tear Board</p>
                        <p className="text-xs text-slate-400">Chew-safe</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm text-miko-yellow">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pages</p>
                        <p className="font-medium text-charcoal">{specs.pages || 22} Pages</p>
                        <p className="text-xs text-slate-400">Full color</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm text-green-500">
                        <Weight className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weight</p>
                        <p className="font-medium text-charcoal">{specs.weight_g || 200}g</p>
                        <p className="text-xs text-slate-400">Lightweight</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
