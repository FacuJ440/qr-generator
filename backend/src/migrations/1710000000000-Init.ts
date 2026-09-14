import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1710000000000 implements MigrationInterface {
  name = 'Init1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- users ---
    await queryRunner.query(`
      CREATE TYPE "public"."users_plan_enum" AS ENUM ('free', 'pro', 'enterprise');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM ('user', 'admin');
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "plan" "public"."users_plan_enum" NOT NULL DEFAULT 'free',
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "refresh_token_hash" character varying,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "pk_users" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX "ix_users_email" ON "users" ("email");`);

    // --- qr_codes ---
    await queryRunner.query(`
      CREATE TYPE "public"."qr_codes_type_enum" AS ENUM ('static', 'dynamic');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."qr_codes_category_enum" AS ENUM ('url', 'text', 'wifi', 'vcard', 'email', 'phone', 'sms');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."qr_codes_status_enum" AS ENUM ('active', 'paused', 'expired', 'archived');
    `);
    await queryRunner.query(`
      CREATE TABLE "qr_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "public"."qr_codes_type_enum" NOT NULL,
        "category" "public"."qr_codes_category_enum" NOT NULL,
        "title" character varying NOT NULL,
        "style_config" jsonb NOT NULL DEFAULT '{}',
        "status" "public"."qr_codes_status_enum" NOT NULL DEFAULT 'active',
        "is_archived" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_qr_codes" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX "ix_qr_codes_user_id" ON "qr_codes" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "ix_qr_codes_created_at" ON "qr_codes" ("created_at");`);
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
        ADD CONSTRAINT "fk_qr_codes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    `);

    // --- qr_static_content ---
    await queryRunner.query(`
      CREATE TABLE "qr_static_content" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "qr_code_id" uuid NOT NULL,
        "content" jsonb NOT NULL,
        CONSTRAINT "pk_qr_static_content" PRIMARY KEY ("id"),
        CONSTRAINT "uq_qr_static_content_qr_code_id" UNIQUE ("qr_code_id")
      );
    `);
    await queryRunner.query(`
      ALTER TABLE "qr_static_content"
        ADD CONSTRAINT "fk_qr_static_content_qr_code" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE CASCADE;
    `);

    // --- qr_dynamic_content ---
    await queryRunner.query(`
      CREATE TABLE "qr_dynamic_content" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "qr_code_id" uuid NOT NULL,
        "short_code" character varying NOT NULL,
        "target_url" text NOT NULL,
        "expires_at" timestamptz,
        "scan_count" bigint NOT NULL DEFAULT 0,
        CONSTRAINT "pk_qr_dynamic_content" PRIMARY KEY ("id"),
        CONSTRAINT "uq_qr_dynamic_content_qr_code_id" UNIQUE ("qr_code_id"),
        CONSTRAINT "uq_qr_dynamic_content_short_code" UNIQUE ("short_code")
      );
    `);
    await queryRunner.query(`CREATE INDEX "ix_qr_dynamic_content_short_code" ON "qr_dynamic_content" ("short_code");`);
    await queryRunner.query(`
      ALTER TABLE "qr_dynamic_content"
        ADD CONSTRAINT "fk_qr_dynamic_content_qr_code" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE CASCADE;
    `);

    // --- qr_scans ---
    await queryRunner.query(`
      CREATE TYPE "public"."qr_scans_device_type_enum" AS ENUM ('mobile', 'tablet', 'desktop', 'unknown');
    `);
    await queryRunner.query(`
      CREATE TABLE "qr_scans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "qr_code_id" uuid NOT NULL,
        "scanned_at" timestamptz NOT NULL,
        "ip_address" character varying,
        "user_agent" text,
        "device_type" "public"."qr_scans_device_type_enum" NOT NULL DEFAULT 'unknown',
        "browser" character varying,
        "os" character varying,
        "country" character varying,
        "city" character varying,
        "referrer" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_qr_scans" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX "ix_qr_scans_qr_code_id" ON "qr_scans" ("qr_code_id");`);
    await queryRunner.query(`CREATE INDEX "ix_qr_scans_scanned_at" ON "qr_scans" ("scanned_at");`);
    await queryRunner.query(`CREATE INDEX "ix_qr_scans_qr_code_scanned_at" ON "qr_scans" ("qr_code_id", "scanned_at");`);
    await queryRunner.query(`
      ALTER TABLE "qr_scans"
        ADD CONSTRAINT "fk_qr_scans_qr_code" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE CASCADE;
    `);

    // --- enable uuid extension ---
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_scans";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."qr_scans_device_type_enum";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_dynamic_content";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_static_content";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_codes";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."qr_codes_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."qr_codes_category_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."qr_codes_type_enum";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_plan_enum";`);
  }
}
