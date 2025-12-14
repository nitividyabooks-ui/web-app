import { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

interface BookListProps {
    initialProducts: Product[];
}

export function BookList({ initialProducts }: BookListProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {initialProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
