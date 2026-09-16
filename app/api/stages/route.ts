import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { StageDocument } from "@/lib/types";

export const runtime = "nodejs";

export const DEFAULT_STAGES: StageDocument[] = [
  { id: "todo", title: "To do", isCustom: false },
  { id: "in_progress", title: "In progress", isCustom: false },
  { id: "under_review", title: "Under review", isCustom: false },
  { id: "ready", title: "Ready", isCustom: false },
  { id: "completed", title: "Completed", isCustom: false },
];

const DEFAULT_STAGE_IDS = new Set(DEFAULT_STAGES.map((s) => s.id));

async function requireUserId() {
  const { userId } = await auth();
  return userId;
}

// ─── GET /api/stages ─────────────────────────────────────────────────────────
// Returns global default stages + user's private custom stages
export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return Response.json({ stages: DEFAULT_STAGES });
  }

  try {
    const db = await getDatabase();
    const customStages = await db
      .collection<StageDocument>("stages")
      .find({ userId })
      .sort({ createdAt: 1 })
      .project({ _id: 0, userId: 0 })
      .toArray();

    return Response.json({
      stages: [...DEFAULT_STAGES, ...customStages],
    });
  } catch (error) {
    console.error("Unable to load stages", error);
    return Response.json({ stages: DEFAULT_STAGES });
  }
}

// ─── POST /api/stages ────────────────────────────────────────────────────────
// Creates a user-specific custom stage in MongoDB (visible only to this user)
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { title?: unknown };
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";

    if (!rawTitle) {
      return Response.json({ error: "Stage title is required" }, { status: 400 });
    }

    if (rawTitle.length > 50) {
      return Response.json({ error: "Stage title is too long (max 50 characters)" }, { status: 400 });
    }

    const stageId = `stage_${Date.now()}_${new ObjectId().toHexString().slice(-4)}`;
    const now = new Date();

    const stageDoc: StageDocument = {
      id: stageId,
      userId,
      title: rawTitle,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    await db.collection<StageDocument>("stages").insertOne(stageDoc);

    return Response.json(
      {
        stage: {
          id: stageDoc.id,
          title: stageDoc.title,
          isCustom: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to create stage", error);
    return Response.json({ error: "Unable to create stage" }, { status: 500 });
  }
}

// ─── DELETE /api/stages ──────────────────────────────────────────────────────
// Deletes a user-specific custom stage (only by the creator, default stages protected)
export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown };
    const url = new URL(request.url);
    const stageId = typeof body.id === "string" ? body.id : url.searchParams.get("id");

    if (!stageId) {
      return Response.json({ error: "Stage ID is required" }, { status: 400 });
    }

    // Protect default system stages from being deleted
    if (DEFAULT_STAGE_IDS.has(stageId)) {
      return Response.json({ error: "Default system stages cannot be deleted" }, { status: 400 });
    }

    const db = await getDatabase();

    // Delete custom stage from stages collection
    const result = await db.collection<StageDocument>("stages").deleteOne({
      id: stageId,
      userId,
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Stage not found or unauthorized" }, { status: 404 });
    }

    // Clean up any tasks associated with this deleted custom stage for this user
    await db.collection("tasks").deleteMany({
      userId,
      columnId: stageId,
    });

    return Response.json({ success: true, deletedId: stageId });
  } catch (error) {
    console.error("Unable to delete stage", error);
    return Response.json({ error: "Unable to delete stage" }, { status: 500 });
  }
}
