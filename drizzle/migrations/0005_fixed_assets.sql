CREATE TABLE "fixed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inventory_number" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"acquisition_date" date NOT NULL,
	"acquisition_cost" numeric(15, 2) NOT NULL,
	"salvage_value" numeric(15, 2) DEFAULT '0',
	"useful_life_months" numeric NOT NULL,
	"amortization_method" text DEFAULT 'straight_line',
	"accumulated_amortization" numeric(15, 2) DEFAULT '0',
	"book_value" numeric(15, 2),
	"location" text,
	"notes" text,
	"is_active" text DEFAULT 'true',
	"written_off_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
