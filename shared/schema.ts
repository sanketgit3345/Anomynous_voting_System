import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  options: json("options").notNull().$type<string[]>(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isAnonymized: boolean("is_anonymized").default(true).notNull()
});

export const insertPollSchema = createInsertSchema(polls).pick({
  title: true,
  description: true,
  options: true,
  expiresAt: true,
  isAnonymized: true,
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  userId: integer("user_id"), // Optional to support anonymous voting
  encryptedData: text("encrypted_data"), // For storing encrypted vote data
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  pollId: true,
  optionIndex: true,
  encryptedData: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
