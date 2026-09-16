// Shared types for all API routes

export interface UserDocument {
  clerkId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ColumnId = string;

export interface StageDocument {
  id: string;
  userId?: string;
  title: string;
  isCustom: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoredComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes?: number;
}

export interface StoredActivity {
  id: string;
  type: "created" | "status_changed" | "due_date_changed" | "comment_added" | "assigned" | "updated";
  userName: string;
  userAvatar?: string;
  action: string;
  details?: string;
  note?: string;
  timestamp: string;
}

export interface StoredTask {
  id: string;
  userId: string;
  columnId: ColumnId;
  title: string;
  description: string;
  tags: { label: string; color: string }[];
  dueDate: string;
  users: { name: string; avatar: string }[];
  commentsCount: number;
  attachmentsCount: number;
  previewImage?: string;
  isFloating?: boolean;
  comments?: StoredComment[];
  activities?: StoredActivity[];
  creatorName?: string;
  creatorAvatar?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
