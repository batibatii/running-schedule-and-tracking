import { db } from "@/lib/db";
import { users, type User, type NewUser } from "@/lib/db/schema";
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
  password: string;
}): Promise<User> {
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: data.password,
    })
    .returning();

  return newUser;
}
