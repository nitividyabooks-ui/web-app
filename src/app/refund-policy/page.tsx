export const metadata = {
  title: "Refund Policy — NitiVidya Books",
  description: "Returns, refunds, cancellations, and replacements policy for NitiVidya Books.",
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 prose prose-slate max-w-3xl min-h-screen">
      <h1>Refund Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        At NitiVidya Books, we care about your experience. This Refund Policy explains how returns, replacements,
        cancellations, and refunds work for purchases made on our website.
      </p>

      <h2>Eligibility</h2>
      <p>
        Books must be unused, in original condition, and in original packaging to be eligible for a return. We may
        refuse returns that show signs of use, damage (not caused in transit), or tampering.
      </p>

      <h2>Damaged / Incorrect Items</h2>
      <p>
        If you receive an item that is damaged in transit or incorrect, please contact us within <strong>48 hours</strong>{" "}
        of delivery with your order details and clear photos. We will arrange a replacement or a refund as applicable.
      </p>

      <h2>Return Window</h2>
      <p>
        Return requests must be raised within <strong>7 days</strong> of delivery. After approval, we will share return
        instructions.
      </p>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect the returned item, we will inform you of approval or rejection. If approved, refunds
        are processed to the original payment method (where applicable) within <strong>5–10 business days</strong>.
      </p>

      <h2>Shipping Charges</h2>
      <p>
        Shipping charges (if any) are non-refundable unless the return is due to a damaged or incorrect item. For
        approved returns not related to damage/incorrect delivery, return shipping may be borne by the customer.
      </p>

      <h2>Cancellations</h2>
      <p>
        You can request a cancellation before the order is shipped. If the order has already shipped, it cannot be
        cancelled and must follow the return process (if eligible).
      </p>

      <h2>How to Request a Return / Refund</h2>
      <p>
        Contact us with your order details:
      </p>
      <ul>
        <li>Email: <strong>nitividyabooks@gmail.com</strong></li>
        <li>Phone: <strong>+919315383801</strong></li>
      </ul>

      <h2>Notes</h2>
      <p>
        This policy may be updated from time to time. The latest version will always be available on this page.
      </p>
    </div>
  );
}


