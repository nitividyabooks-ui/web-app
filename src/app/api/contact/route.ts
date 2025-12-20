import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().min(1).max(5000),
  source: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.parse(body);

    const userAgent = request.headers.get("user-agent");
    const referer = request.headers.get("referer");

    const created = await prisma.contactMessage.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        subject: parsed.subject || null,
        message: parsed.message,
        source: parsed.source || "contact_page",
        meta: {
          userAgent,
          referer,
        } satisfies Prisma.InputJsonValue,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, ...created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues }, { status: 400 });
    }
    console.error("Contact submit error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}


