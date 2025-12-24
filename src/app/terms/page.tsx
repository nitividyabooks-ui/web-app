import Link from "next/link";

export const metadata = {
    title: "Terms and Conditions — NitiVidya Books",
    description: "Terms and conditions for using NitiVidya Books website and services.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl min-h-screen">
            <h1>Terms and Conditions</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                Welcome to NitiVidya Books. By accessing or using our website at nitividya.com, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>

            <h2>1. About Our Service</h2>
            <p>
                NitiVidya Books is an online platform for purchasing children's books. We currently operate on a <strong>WhatsApp-based ordering system</strong>. When you place an order, your order details are saved in our system, and you are redirected to WhatsApp to confirm and complete the order with our team.
            </p>

            <h2>2. Ordering Process</h2>
            <ul>
                <li>Add items to your cart on our website</li>
                <li>Provide your name, phone number, and delivery address</li>
                <li>You will be redirected to WhatsApp with a pre-filled order message</li>
                <li>Our team will confirm product availability, delivery charges, and payment method</li>
                <li>Payment is collected via Cash on Delivery (COD), UPI, or Bank Transfer as confirmed on WhatsApp</li>
            </ul>

            <h2>3. Pricing & Payment</h2>
            <p>
                All prices displayed on our website are in Indian Rupees (INR) and include applicable taxes. Prices are subject to change without notice. <strong>We do not process online payments on this website.</strong> Payment is confirmed and collected separately via WhatsApp communication.
            </p>

            <h2>4. Order Confirmation</h2>
            <p>
                An order is considered confirmed only after our team acknowledges it on WhatsApp and you agree to the final amount including any shipping charges. We reserve the right to cancel orders due to product unavailability, pricing errors, or suspected fraud.
            </p>

            <h2>5. Shipping & Delivery</h2>
            <p>
                Shipping charges and estimated delivery times will be communicated on WhatsApp based on your location. We aim to dispatch orders within 1-3 business days after payment confirmation.
            </p>

            <h2>6. Returns & Refunds</h2>
            <p>
                For details on returns and refunds, please refer to our <Link href="/return-policy" className="text-primary hover:underline">Return Policy</Link>.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
                All content on this website, including text, images, logos, and illustrations (including Miko the elephant), are the property of NitiVidya Books and are protected by copyright laws. You may not use, reproduce, or distribute any content without our written permission.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
                NitiVidya Books shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our liability is limited to the purchase price of the products ordered.
            </p>

            <h2>9. Privacy</h2>
            <p>
                Your use of our website is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using our services, you consent to the collection and use of your information as described therein.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
                We may update these Terms of Service from time to time. The latest version will always be available on this page. Continued use of our website after changes constitutes acceptance of the updated terms.
            </p>

            <h2>11. Contact Us</h2>
            <p>
                For any questions about these Terms of Service, please contact us:
            </p>
            <ul>
                <li>Email: <strong>nitividyabooks@gmail.com</strong></li>
                <li>Phone/WhatsApp: <strong>+919315383801</strong></li>
            </ul>

            <h2>12. Governing Law</h2>
            <p>
                These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Delhi, India.
            </p>
        </div>
    );
}
