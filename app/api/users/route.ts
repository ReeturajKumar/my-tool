import { currentUser } from "@clerk/nextjs/server";
import { getDatabase } from "@/lib/mongodb";
import { UserDocument } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/users
 * Register or update the currently authenticated Clerk user in MongoDB.
 * Called client-side after sign-in/sign-up as a fallback to the webhook.
 */
export async function POST() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const document: UserDocument = {
    clerkId: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    username: user.username ?? "",
    email: user.primaryEmailAddress?.emailAddress ?? "",
    imageUrl: user.imageUrl ?? "",
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = await getDatabase();
    await db
      .collection<UserDocument>("users")
      .updateOne(
        { clerkId: user.id },
        {
          $set: {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            username: user.username ?? "",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            imageUrl: user.imageUrl ?? "",
            updatedAt: now,
          },
          $setOnInsert: { clerkId: user.id, createdAt: now },
        },
        { upsert: true }
      );
    return Response.json({ user: document });
  } catch (error) {
    console.error("Unable to register user", error);
    return Response.json({ error: "Unable to register user" }, { status: 500 });
  }
}

/**
 * GET /api/users
 * Check whether the currently authenticated Clerk user exists in MongoDB.
 * Returns `{ exists: true, user }` or `{ exists: false }`.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDatabase();
    const doc = await db
      .collection<UserDocument>("users")
      .findOne({ clerkId: user.id });

    if (doc) return Response.json({ exists: true, user: doc });
    return Response.json({ exists: false });
  } catch (error) {
    console.error("Error verifying user in DB", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
