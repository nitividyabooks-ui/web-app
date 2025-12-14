export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl">
            <h1>Terms of Service</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
                Welcome to NitiVidya Books. By accessing or using our website, you agree to be bound by these Terms of Service.
            </p>
            <h2>Ordering</h2>
            <p>
                All orders are subject to availability. We reserve the right to refuse service to anyone for any reason at any time.
            </p>
            <h2>Returns & Refunds</h2>
            <p>
                Please contact us via WhatsApp for any return or refund requests.
            </p>
        </div>
    );
}
