export const metadata = {
    title: "Privacy Policy — NitiVidya Books",
    description: "How NitiVidya Books collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl min-h-screen">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                At NitiVidya Books, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our website and services.
            </p>

            <h2>1. Information We Collect</h2>
            
            <h3>Personal Information You Provide</h3>
            <p>When you place an order or interact with us, we collect:</p>
            <ul>
                <li><strong>Name</strong> — to address your orders and communications</li>
                <li><strong>Phone Number</strong> — to confirm orders via WhatsApp and for delivery coordination</li>
                <li><strong>Email Address</strong> (optional) — for order updates and promotional communications</li>
                <li><strong>Delivery Address</strong> — to ship your orders</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>We may automatically collect:</p>
            <ul>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Pages visited and time spent on our website</li>
                <li>Referral source (how you found our website)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about orders via WhatsApp</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Respond to your questions and requests</li>
                <li>Improve our website and services</li>
                <li>Send promotional offers (only with your consent)</li>
                <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Data Storage & Security</h2>
            <p>
                Your order information is stored securely in our database hosted on industry-standard cloud infrastructure. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction.
            </p>
            <p>
                <strong>Note:</strong> We do not store any payment card information. All payments are processed offline via Cash on Delivery, UPI, or direct bank transfer.
            </p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul>
                <li><strong>Delivery partners</strong> — to ship your orders</li>
                <li><strong>Service providers</strong> — who help us operate our website (hosting, analytics)</li>
                <li><strong>Legal authorities</strong> — if required by law or to protect our rights</li>
            </ul>

            <h2>5. Cookies & Analytics</h2>
            <p>
                We use cookies and similar technologies to improve your browsing experience and analyze website traffic. We use Google Analytics to understand how visitors use our website. You can control cookie preferences through your browser settings.
            </p>

            <h2>6. Third-Party Services</h2>
            <p>Our website may contain links to third-party services including:</p>
            <ul>
                <li><strong>WhatsApp</strong> — for order communications (governed by WhatsApp's privacy policy)</li>
                <li><strong>Google Analytics</strong> — for website analytics</li>
                <li><strong>Social media platforms</strong> — for social sharing</li>
            </ul>
            <p>
                We are not responsible for the privacy practices of these third-party services. Please review their respective privacy policies.
            </p>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li><strong>Access</strong> — Request a copy of your personal data we hold</li>
                <li><strong>Correction</strong> — Request correction of inaccurate data</li>
                <li><strong>Deletion</strong> — Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong>Opt-out</strong> — Unsubscribe from promotional communications</li>
            </ul>
            <p>To exercise these rights, please contact us using the details below.</p>

            <h2>8. Data Retention</h2>
            <p>
                We retain your order information for as long as necessary to fulfill our services, comply with legal obligations, and resolve disputes. Typically, order data is retained for 7 years for tax and legal purposes.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
                While our products are designed for children, our website and ordering services are intended for adults (parents/guardians). We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
                We may update this Privacy Policy from time to time. The latest version will always be available on this page with the updated date. We encourage you to review this policy periodically.
            </p>

            <h2>11. Contact Us</h2>
            <p>
                For any questions, concerns, or requests regarding your privacy or this policy, please contact us:
            </p>
            <ul>
                <li>Email: <strong>nitividyabooks@gmail.com</strong></li>
                <li>Phone/WhatsApp: <strong>+919315383801</strong></li>
            </ul>

            <h2>12. Grievance Officer</h2>
            <p>
                In accordance with the Information Technology Act 2000 and rules made thereunder, the Grievance Officer for this website is:
            </p>
            <p>
                <strong>Name:</strong> NitiVidya Books Team<br />
                <strong>Email:</strong> nitividyabooks@gmail.com<br />
                <strong>Response Time:</strong> Within 48 hours
            </p>
        </div>
    );
}
