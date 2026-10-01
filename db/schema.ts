import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const daily = sqliteTable("daily", { id: text("id").primaryKey(), signalId: text("signal_id").notNull(), recordDate: text("record_date").notNull(), reading: text("reading").notNull(), raw: text("raw").notNull() });
export const boardStatus = sqliteTable("board_status", { id: text("id").primaryKey(), errorCode: text("error_code").notNull(), attemptedAt: text("attempted_at").notNull() });
