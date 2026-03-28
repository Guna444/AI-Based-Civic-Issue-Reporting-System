import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@/lib/prisma";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { type, data } = evt;

  try {
    if (type === "user.created") {
      const email = data.email_addresses[0]?.email_address;
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

      // Check if this is the admin email
      const role =
        email === process.env.ADMIN_EMAIL ? "ADMIN" : "CITIZEN";

      await prisma.user.create({
        data: {
          clerkId: data.id,
          email,
          name,
          imageUrl: data.image_url,
          role,
        },
      });
    }

    if (type === "user.updated") {
      const email = data.email_addresses[0]?.email_address;
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

      await prisma.user.update({
        where: { clerkId: data.id },
        data: {
          email,
          name,
          imageUrl: data.image_url,
        },
      });
    }

    if (type === "user.deleted") {
      await prisma.user.delete({
        where: { clerkId: data.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error in webhook:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
