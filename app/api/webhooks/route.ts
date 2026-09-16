import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { getDatabase } from "@/lib/mongodb";
import { UserDocument } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/webhooks
 * Receives Clerk `user.created` webhook events and registers the user in MongoDB.
 * This route must be excluded from auth middleware (no Clerk session present).
 * Configure the webhook URL in the Clerk Dashboard:
 *   https://dashboard.clerk.com → Webhooks → Add endpoint → /api/webhooks
 */
export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET)
    throw new Error("Missing CLERK_WEBHOOK_SIGNING_SECRET in .env.local");

  const hdr = await headers();
  const svixId = hdr.get("svix-id");
  const svixTimestamp = hdr.get("svix-timestamp");
  const svixSignature = hdr.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature)
    return new Response("Missing Svix headers", { status: 400 });

  const body = JSON.stringify(await req.json());

  let evt: WebhookEvent;
  try {
    evt = new Webhook(SIGNING_SECRET).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, first_name, last_name, username, email_addresses, image_url } =
      evt.data;

    const now = new Date();

    try {
      const db = await getDatabase();
      await db
        .collection<UserDocument>("users")
        .updateOne(
          { clerkId: id },
          {
            $set: {
              firstName: first_name ?? "",
              lastName: last_name ?? "",
              username: username ?? "",
              email: email_addresses?.[0]?.email_address ?? "",
              imageUrl: image_url ?? "",
              updatedAt: now,
            },
            $setOnInsert: { clerkId: id, createdAt: now },
          },
          { upsert: true }
        );
      console.log("✅ Clerk user registered in DB:", id);
    } catch (err) {
      console.error("DB error during webhook user registration", err);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
