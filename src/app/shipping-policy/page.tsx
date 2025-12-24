
export const metadata = {
    title: "Shipping Policy — NitiVidya Books",
    description: "Shipping and Delivery Policy for NitiVidya Books.",
};

export default function ShippingPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl min-h-screen">
            <h1>Shipping Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                At NitiVidya Books, we are committed to delivering your order accurately, in good condition, and on time.
            </p>

            <h2>1. Shipping Coverage</h2>
            <p>
                We currently ship to addresses within India. Please note that we may not be able to ship to certain remote locations. If we are unable to ship to your location, we will inform you at the time of order confirmation on WhatsApp.
            </p>

            <h2>2. Delivery Timelines</h2>
            <p>
                We aim to dispatch all orders within <strong>1-3 business days</strong> of order confirmation.
            </p>
            <ul>
                <li><strong>Metro Cities:</strong> 3-5 business days after dispatch.</li>
                <li><strong>Non-Metro Cities:</strong> 5-7 business days after dispatch.</li>
                <li><strong>Remote Areas:</strong> 7-10 business days after dispatch.</li>
            </ul>
            <p>
                Please note that delivery times are estimates and may vary due to external factors such as weather conditions, strikes, or courier delays.
            </p>

            <h2>3. Shipping Charges</h2>
            <p>
                Shipping charges are calculated based on the weight of your order and your delivery location. The final shipping cost will be communicated to you via WhatsApp before you confirm your payment.
            </p>
            <p>
                We may offer free shipping on orders above a certain value, which will be highlighted on our website or communicated during the order process.
            </p>

            <h2>4. Tracking Your Order</h2>
            <p>
                Once your order is shipped, we will share the tracking details with you via WhatsApp or Email. You can use these details to track the status of your shipment on the courier partner's website.
            </p>

            <h2>5. Damaged or Missing Items</h2>
            <p>
                If you receive a package that is open or visibly damaged, please do not accept it. Contact us immediately at <strong>nitividyabooks@gmail.com</strong> or on WhatsApp at <strong>+919315383801</strong>.
            </p>
            <p>
                If you discover that an item is missing or damaged after opening the package, please refer to our <a href="/return-policy">Return and Refund Policy</a> for instructions on how to report the issue.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have any questions about our Shipping Policy, please contact us:
            </p>
            <ul>
                <li>Email: <strong>nitividyabooks@gmail.com</strong></li>
                <li>Phone: <strong>+919315383801</strong></li>
            </ul>
        </div>
    );
}
