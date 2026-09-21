import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  date,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =========================================================
// 1. PROFILES TABLE
// =========================================================
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  avatar_url: text('avatar_url'),
  currency: text('currency').default('IDR'),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================
// 2. POCKETS (Kantong Dana) TABLE
// =========================================================
export const pockets = pgTable(
  'pockets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').default('Wallet').notNull(),
    color: text('color').default('#3B82F6').notNull(),
    target_amount: numeric('target_amount', { precision: 15, scale: 2 })
      .default('0')
      .notNull(),
    initial_balance: numeric('initial_balance', { precision: 15, scale: 2 })
      .default('0')
      .notNull(),
    is_default: boolean('is_default').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_pockets_user').on(table.user_id),
  ]
);

// =========================================================
// 3. CATEGORIES TABLE
// =========================================================
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    name: text('name').notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    icon: text('icon').default('Tag').notNull(),
    color: text('color').default('#64748B').notNull(),
    is_default: boolean('is_default').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_categories_user').on(table.user_id),
    check('categories_type_check', sql`${table.type} IN ('income', 'expense')`),
  ]
);

// =========================================================
// 4. TRANSACTIONS TABLE (Income & Expense)
// =========================================================
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    pocket_id: uuid('pocket_id')
      .references(() => pockets.id, { onDelete: 'restrict' })
      .notNull(),
    category_id: uuid('category_id')
      .references(() => categories.id, { onDelete: 'restrict' })
      .notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    transaction_date: date('transaction_date').defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_transactions_user').on(table.user_id),
    index('idx_transactions_pocket').on(table.pocket_id),
    index('idx_transactions_category').on(table.category_id),
    index('idx_transactions_date').on(table.transaction_date),
    check('transactions_type_check', sql`${table.type} IN ('income', 'expense')`),
    check('transactions_amount_check', sql`${table.amount} > 0`),
  ]
);

// =========================================================
// 5. TRANSFERS TABLE (Saving / Transfer between pockets)
// =========================================================
export const transfers = pgTable(
  'transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    from_pocket_id: uuid('from_pocket_id')
      .references(() => pockets.id, { onDelete: 'restrict' })
      .notNull(),
    to_pocket_id: uuid('to_pocket_id')
      .references(() => pockets.id, { onDelete: 'restrict' })
      .notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    title: text('title').default('Transfer Dana').notNull(),
    description: text('description'),
    transfer_date: date('transfer_date').defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_transfers_user').on(table.user_id),
    index('idx_transfers_from_pocket').on(table.from_pocket_id),
    index('idx_transfers_to_pocket').on(table.to_pocket_id),
    index('idx_transfers_date').on(table.transfer_date),
    check('transfers_amount_check', sql`${table.amount} > 0`),
    check('check_diff_pockets', sql`${table.from_pocket_id} != ${table.to_pocket_id}`),
  ]
);

// =========================================================
// RELATIONS DEFINITIONS
// =========================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  pockets: many(pockets),
  categories: many(categories),
  transactions: many(transactions),
  transfers: many(transfers),
}));

export const pocketsRelations = relations(pockets, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [pockets.user_id],
    references: [profiles.id],
  }),
  transactions: many(transactions),
  transfersFrom: many(transfers, { relationName: 'fromPocket' }),
  transfersTo: many(transfers, { relationName: 'toPocket' }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [categories.user_id],
    references: [profiles.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.user_id],
    references: [profiles.id],
  }),
  pocket: one(pockets, {
    fields: [transactions.pocket_id],
    references: [pockets.id],
  }),
  category: one(categories, {
    fields: [transactions.category_id],
    references: [categories.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  profile: one(profiles, {
    fields: [transfers.user_id],
    references: [profiles.id],
  }),
  fromPocket: one(pockets, {
    fields: [transfers.from_pocket_id],
    references: [pockets.id],
    relationName: 'fromPocket',
  }),
  toPocket: one(pockets, {
    fields: [transfers.to_pocket_id],
    references: [pockets.id],
    relationName: 'toPocket',
  }),
}));

// =========================================================
// TYPE INFERENCE HELPERS
// =========================================================
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Pocket = typeof pockets.$inferSelect;
export type NewPocket = typeof pockets.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;
