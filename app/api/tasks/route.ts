import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { ColumnId, StoredTask } from "@/lib/types";

export const runtime = "nodejs";

// ─── helpers ─────────────────────────────────────────────────────────────────

type TaskPayload = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  dueDate?: unknown;
  users?: unknown;
  commentsCount?: unknown;
  attachmentsCount?: unknown;
  previewImage?: unknown;
  isFloating?: unknown;
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function sanitizeTask(task: TaskPayload, id: string) {
  const title = asString(task.title);
  if (!title) return null;

  const tags = Array.isArray(task.tags)
    ? task.tags.flatMap((tag) => {
        if (!tag || typeof tag !== "object") return [];
        const v = tag as { label?: unknown; color?: unknown };
        const label = asString(v.label);
        return label ? [{ label, color: asString(v.color) }] : [];
      })
    : [];

  const users = Array.isArray(task.users)
    ? task.users.flatMap((user) => {
        if (!user || typeof user !== "object") return [];
        const v = user as { name?: unknown; avatar?: unknown };
        const name = asString(v.name);
        const avatar = asString(v.avatar);
        return name && avatar ? [{ name, avatar }] : [];
      })
    : [];

  const rawComments = Array.isArray((task as { comments?: unknown }).comments)
    ? (task as { comments?: unknown[] }).comments!
    : [];

  const isLegacyMock = (name: string, text: string) => {
    const lName = name.toLowerCase();
    const lText = text.toLowerCase();
    return (
      lName.includes("alexandar") ||
      lName.includes("omah") ||
      lText.includes("thanks, omah") ||
      lText.includes("crucial for us to have a clear understanding")
    );
  };

  const comments = rawComments.flatMap((c) => {
    if (!c || typeof c !== "object") return [];
    const item = c as Record<string, unknown>;
    const userName = asString(item.userName, "User");
    const text = asString(item.text);
    if (!text || isLegacyMock(userName, text)) return [];
    return [
      {
        id: asString(item.id) || `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userName,
        userAvatar: asString(item.userAvatar) || undefined,
        text,
        createdAt: asString(item.createdAt, new Date().toISOString()),
        likes: asCount(item.likes),
      },
    ];
  });

  const rawActivities = Array.isArray((task as { activities?: unknown }).activities)
    ? (task as { activities?: unknown[] }).activities!
    : [];

  const activities = rawActivities.flatMap((a) => {
    if (!a || typeof a !== "object") return [];
    const item = a as Record<string, unknown>;
    const action = asString(item.action);
    if (!action) return [];
    return [
      {
        id: asString(item.id) || `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: (asString(item.type) || "updated") as
          | "created"
          | "status_changed"
          | "due_date_changed"
          | "comment_added"
          | "assigned"
          | "updated",
        userName: asString(item.userName, "User"),
        userAvatar: asString(item.userAvatar) || undefined,
        action,
        details: asString(item.details) || undefined,
        timestamp: asString(item.timestamp, new Date().toISOString()),
      },
    ];
  });

  const rawCreatedAt = asString((task as { createdAt?: unknown }).createdAt);

  return {
    id,
    title,
    description: asString(task.description, "No description provided."),
    tags,
    dueDate: asString(task.dueDate, "Upcoming"),
    users,
    commentsCount: comments.length > 0 ? comments.length : asCount(task.commentsCount),
    attachmentsCount: asCount(task.attachmentsCount),
    previewImage: asString(task.previewImage) || undefined,
    isFloating: Boolean(task.isFloating),
    comments,
    activities,
    creatorName: asString((task as { creatorName?: unknown }).creatorName),
    creatorAvatar: asString((task as { creatorAvatar?: unknown }).creatorAvatar),
    createdAt: rawCreatedAt || undefined,
  };
}

async function requireUserId() {
  const { userId } = await auth();
  return userId;
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDatabase();
    const tasks = await db
      .collection<StoredTask>("tasks")
      .find({ userId })
      .sort({ updatedAt: -1 })
      .project({ _id: 0, userId: 0 })
      .toArray();

    const isLegacyMock = (name: string, text: string) => {
      const lName = name.toLowerCase();
      const lText = text.toLowerCase();
      return (
        lName.includes("alexandar") ||
        lName.includes("omah") ||
        lText.includes("thanks, omah") ||
        lText.includes("crucial for us to have a clear understanding")
      );
    };

    const cleanedTasks = tasks.map((t) => ({
      ...t,
      comments: (t.comments || []).filter(
        (c: { userName?: string; text?: string }) => !isLegacyMock(c.userName || "", c.text || "")
      ),
      commentsCount: (t.comments || []).filter(
        (c: { userName?: string; text?: string }) => !isLegacyMock(c.userName || "", c.text || "")
      ).length,
    }));

    return Response.json({ tasks: cleanedTasks });
  } catch (error) {
    console.error("Unable to load tasks", error);
    return Response.json({ error: "Unable to load tasks" }, { status: 500 });
  }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      columnId?: unknown;
      task?: TaskPayload;
    };
    if (!isColumnId(body.columnId) || !body.task)
      return Response.json({ error: "Invalid task data" }, { status: 400 });

    const id = asString(body.task.id) || `task-${new ObjectId().toHexString()}`;
    const task = sanitizeTask(body.task, id);
    if (!task)
      return Response.json({ error: "Task title is required" }, { status: 400 });

    const now = new Date();
    const existingTaskCreatedAt = (body.task as { createdAt?: unknown }).createdAt;
    const taskCreatedAt = existingTaskCreatedAt ? new Date(asString(existingTaskCreatedAt)) : now;
    const validCreatedAt = isNaN(taskCreatedAt.getTime()) ? now : taskCreatedAt;

    const fieldsToSet: Record<string, unknown> = { ...task };
    delete (fieldsToSet as { createdAt?: string }).createdAt;

    const fieldsToUnset: Record<string, "" | 1> = {};
    if (!task.previewImage) {
      delete fieldsToSet.previewImage;
      fieldsToUnset.previewImage = "";
    }

    const document = {
      ...fieldsToSet,
      userId,
      columnId: body.columnId,
      updatedAt: now,
    };

    const updateQuery: Record<string, unknown> = {
      $set: document,
      $setOnInsert: { createdAt: validCreatedAt },
    };
    if (Object.keys(fieldsToUnset).length > 0) {
      updateQuery.$unset = fieldsToUnset;
    }

    await (await getDatabase())
      .collection<StoredTask>("tasks")
      .updateOne(
        { userId, id },
        updateQuery,
        { upsert: true }
      );

    return Response.json({ task: { ...task, columnId: body.columnId } }, { status: 201 });
  } catch (error) {
    console.error("Unable to save task", error);
    return Response.json({ error: "Unable to save task" }, { status: 500 });
  }
}

// ─── PATCH /api/tasks ─────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      tasks?: { columnId?: unknown; task?: TaskPayload }[];
    };
    if (!Array.isArray(body.tasks) || body.tasks.length > 500)
      return Response.json({ error: "Invalid task collection" }, { status: 400 });

    const now = new Date();
    const operations = body.tasks.flatMap((item) => {
      if (!isColumnId(item.columnId) || !item.task) return [];
      const id = asString(item.task.id);
      const task = id ? sanitizeTask(item.task, id) : null;
      if (!task) return [];

      const taskFields: Record<string, unknown> = { ...task };
      delete (taskFields as { createdAt?: string }).createdAt;

      const taskUnset: Record<string, "" | 1> = {};
      if (!task.previewImage) {
        delete taskFields.previewImage;
        taskUnset.previewImage = "";
      }

      const existingTaskCreatedAt = (item.task as { createdAt?: unknown }).createdAt;
      const taskCreatedAt = existingTaskCreatedAt ? new Date(asString(existingTaskCreatedAt)) : now;
      const validCreatedAt = isNaN(taskCreatedAt.getTime()) ? now : taskCreatedAt;

      const updateDoc: Record<string, unknown> = {
        $set: { ...taskFields, userId, columnId: item.columnId, updatedAt: now },
        $setOnInsert: { createdAt: validCreatedAt },
      };
      if (Object.keys(taskUnset).length > 0) {
        updateDoc.$unset = taskUnset;
      }

      return [
        {
          updateOne: {
            filter: { userId, id },
            update: updateDoc,
            upsert: true,
          },
        },
      ];
    });

    if (operations.length !== body.tasks.length)
      return Response.json({ error: "Invalid task collection" }, { status: 400 });

    if (operations.length)
      await (await getDatabase())
        .collection<StoredTask>("tasks")
        .bulkWrite(operations);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unable to sync tasks", error);
    return Response.json({ error: "Unable to sync tasks" }, { status: 500 });
  }
}

// ─── DELETE /api/tasks ────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { id?: unknown };
    const id = asString(body.id);
    if (!id) return Response.json({ error: "Task ID required" }, { status: 400 });

    const db = await getDatabase();
    await db.collection<StoredTask>("tasks").deleteOne({ userId, id });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unable to delete task", error);
    return Response.json({ error: "Unable to delete task" }, { status: 500 });
  }
}

