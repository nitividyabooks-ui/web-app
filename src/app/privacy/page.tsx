export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
                At NitiVidya Books, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
            <h2>Information We Collect</h2>
            <p>
                We collect information you provide directly to us, such as when you place an order via WhatsApp, including your name, phone number, and address.
            </p>
            <h2>How We Use Your Information</h2>
            <p>
                We use your information to process your orders, communicate with you, and improve our services.
            </p>
            <h2>Contact Us</h2>
            <p>
                If you have any questions about this Privacy Policy, please contact us.
            </p>
        </div>
    );
}
