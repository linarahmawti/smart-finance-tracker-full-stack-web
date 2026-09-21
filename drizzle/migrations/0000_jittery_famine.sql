CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"icon" text DEFAULT 'Tag' NOT NULL,
	"color" text DEFAULT '#64748B' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_type_check" CHECK ("categories"."type" IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE "pockets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'Wallet' NOT NULL,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"target_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"initial_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"avatar_url" text,
	"currency" text DEFAULT 'IDR',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pocket_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"transaction_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_type_check" CHECK ("transactions"."type" IN ('income', 'expense')),
	CONSTRAINT "transactions_amount_check" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_pocket_id" uuid NOT NULL,
	"to_pocket_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"title" text DEFAULT 'Transfer Dana' NOT NULL,
	"description" text,
	"transfer_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_amount_check" CHECK ("transfers"."amount" > 0),
	CONSTRAINT "check_diff_pockets" CHECK ("transfers"."from_pocket_id" != "transfers"."to_pocket_id")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pocket_id_pockets_id_fk" FOREIGN KEY ("pocket_id") REFERENCES "public"."pockets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_pocket_id_pockets_id_fk" FOREIGN KEY ("from_pocket_id") REFERENCES "public"."pockets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_pocket_id_pockets_id_fk" FOREIGN KEY ("to_pocket_id") REFERENCES "public"."pockets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_user" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pockets_user" ON "pockets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_user" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_pocket" ON "transactions" USING btree ("pocket_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_category" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_transfers_user" ON "transfers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transfers_from_pocket" ON "transfers" USING btree ("from_pocket_id");--> statement-breakpoint
CREATE INDEX "idx_transfers_to_pocket" ON "transfers" USING btree ("to_pocket_id");--> statement-breakpoint
CREATE INDEX "idx_transfers_date" ON "transfers" USING btree ("transfer_date");