
export const metadata = {
    title: "Return and Refund Policy — NitiVidya Books",
    description: "Return and Refund Policy for NitiVidya Books. Read about our eligibility criteria, return process, timeframes, and refund options.",
};

export default function ReturnPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl min-h-screen">
            <h1>Return and Refund Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                At NitiVidya Books, we specialize in providing high-quality books for children. We want you and your little ones to love every book you purchase. However, if you receive a damaged or incorrect item, we are here to help.
            </p>

            <h2>1. Eligibility Criteria for Returns</h2>
            <p>
                To be eligible for a return, the following conditions must be met:
            </p>
            <ul>
                <li>The item must be unused and in the same condition that you received it.</li>
                <li>It must be in the original packaging.</li>
                <li>The return request must be initiated within <strong>48 hours</strong> of delivery.</li>
                <li><strong>Proof of damage or issue is mandatory.</strong> You must provide clear photos or an unboxing video showing the defect or incorrect item.</li>
            </ul>
            <p>
                <strong>Non-returnable items:</strong> Gift cards, downloadable software products, and personalized items are not eligible for return.
            </p>

            <h2>2. Return Process and Timeframes</h2>
            <p>
                <strong>Timeframe:</strong> You must report any issues within <strong>48 hours</strong> from the date of delivery. Requests made after this window may not be accepted.
            </p>
            <p>
                <strong>Process:</strong>
            </p>
            <ol>
                <li>Contact us via email or phone (details below) immediately upon delivery.</li>
                <li>Include your order number and <strong>attach photos/video proof</strong> of the issue.</li>
                <li>If your return is approved, we will provide you with instructions on how and where to send your package.</li>
                <li>Items sent back to us without first requesting a return will not be accepted.</li>
            </ol>

            <h2>3. Refunds and Exchanges</h2>
            <h3>Refunds</h3>
            <p>
                Once your return is received and inspected, we will notify you of the approval or rejection of your refund.
            </p>
            <ul>
                <li><strong>Approval:</strong> If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within <strong>5-7 business days</strong>.</li>
                <li><strong>Rejection:</strong> If the item is found to be used, damaged (not due to our error), or missing parts, a refund may be denied or only a partial refund granted.</li>
            </ul>

            <h3>Exchanges</h3>
            <p>
                We only replace items if they are defective or damaged. If you need to exchange it for the same item, please contact us.
            </p>

            <h2>4. Cancellations</h2>
            <p>
                You may cancel your order before it has been shipped for a full refund. Once the order has been shipped, it cannot be cancelled and must be treated as a return (if eligible).
            </p>

            <h2>5. Shipping Returns</h2>
            <p>
                You will be responsible for paying for your own shipping costs for returning your item, unless the return is due to a defective or incorrect item sent by us. Shipping costs are non-refundable.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have any questions about our Return Policy, please contact us:
            </p>
            <ul>
                <li>Email: <strong>nitividyabooks@gmail.com</strong></li>
                <li>Phone: <strong>+919315383801</strong></li>
            </ul>
        </div>
    );
}
