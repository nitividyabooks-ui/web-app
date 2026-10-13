# Manual customer updates

Approved workflow: the owner reviews and sends an update from an order page. WhatsApp opens an editable draft that the owner sends in WhatsApp. Email sends the reviewed plain-text message through Resend. There are no automatic sends.

The panel has order confirmation, dispatch, tracking, delay and custom templates, editable subject/message, recipient preview and a history. Shipping and tracking templates require the owner to supply the actual tracking details; they never infer shipment information from an order status. History distinguishes a WhatsApp draft opened from email accepted by the provider; neither claims delivery.

Checkout captures an optional email and forwards it through both order paths. For existing orders without email, the owner can enter a customer email in the panel. A saved email is the only allowed recipient once present.

The new endpoint checks a signed, expiring communication session issued at admin login, the current admin record and same-origin POST requests. ADMIN_SESSION_SECRET must contain at least 32 characters. The existing dashboard cookie remains compatible. Resend configuration and the new secret are required before email sending is enabled.

Logout clears both cookies through a same-origin POST. Previously the toolbar only linked to the login page.

Use a small OrderCommunication table for durable history. A separate table avoids payment/shipping writes replacing Order.meta and losing the audit trail. A unique request key plus Resend idempotency protects retries. Uncertain outcomes remain pending and the same reviewed payload can be retried for up to 23 hours; expired pending attempts require checking Resend rather than silently sending again.

Work remains on codex/manual-customer-updates in an isolated checkout. Provider/database route tests are mocked; browser tests use a temporary fixture and never send real customer messages. Production migration and deployment require a later explicit instruction.
