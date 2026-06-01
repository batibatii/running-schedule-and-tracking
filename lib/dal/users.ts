import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createUser(data: {
  email: string;
  hashedPassword: string;
}): Promise<User> {
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: data.hashedPassword,
    })
    .returning();

  return newUser;
}

export async function getUserLastSyncedAt(
  userId: string,
): Promise<Date | null> {
  const [user] = await db
    .select({ lastSyncedAt: users.lastSyncedAt })
    .from(users)
    .where(eq(users.id, userId));
  return user?.lastSyncedAt ?? null;
}

export async function updateLastSyncedAt(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function markEmailAsVerified(
  email: string,
): Promise<User | undefined> {
  const [updatedUser] = await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email))
    .returning();

  return updatedUser;
}
