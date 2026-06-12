"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;
  }, [name, email, message]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message,
          source: "contact_page",
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus("error");
        setError("Please check your details and try again.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again in a moment.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-input border border-hairline-strong bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="w-full rounded-input border border-hairline-strong bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="contact-phone">
            Phone (optional)
          </label>
          <input
            id="contact-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91..."
            inputMode="tel"
            className="w-full rounded-input border border-hairline-strong bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="contact-subject">
            Subject (optional)
          </label>
          <input
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="How can we help?"
            className="w-full rounded-input border border-hairline-strong bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-ink" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message…"
          rows={6}
          className="w-full rounded-input border border-hairline-strong bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
          required
        />
        <p className="text-xs text-ink-soft font-medium">
          Or email us directly at <span className="text-ink font-semibold">nitividyabooks@gmail.com</span> or call{" "}
          <span className="text-ink font-semibold">+919315383801</span>.
        </p>
      </div>

      {status === "success" && (
        <div className="rounded-input border border-evergreen/20 bg-evergreen-soft px-4 py-3 text-sm font-semibold text-evergreen-deep">
          Thanks! We received your message and will get back to you shortly.
        </div>
      )}

      {status === "error" && (
        <div className="rounded-input border border-terracotta/30 bg-blush px-4 py-3 text-sm font-semibold text-terracotta-deep">
          {error || "Something went wrong."}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="rounded-btn bg-evergreen hover:bg-evergreen-deep text-white"
          disabled={!canSubmit || status === "submitting"}
        >
          {status === "submitting" ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" className="border-white/40 border-t-white" />
              Sending…
            </span>
          ) : (
            "Send message"
          )}
        </Button>
        <span className="text-xs text-ink-soft font-semibold">
          We typically respond within 1–2 business days.
        </span>
      </div>
    </form>
  );
}


