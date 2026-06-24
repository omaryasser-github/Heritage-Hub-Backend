-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'ar');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "MonumentKind" AS ENUM ('monument', 'template');

-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('photo', 'infographic', 'map', 'video');

-- CreateEnum
CREATE TYPE "AwarenessCardType" AS ENUM ('safety', 'cultural', 'did_you_know');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('inaccurate', 'inappropriate', 'outdated', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('system', 'recommendation', 'report_update', 'general');

-- CreateEnum
CREATE TYPE "PersonalityType" AS ENUM ('explorer', 'historian', 'strategist', 'culture_lover');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "InteractionEntityType" AS ENUM ('city', 'monument', 'panorama');

-- CreateEnum
CREATE TYPE "InteractionActionType" AS ENUM ('view_monument', 'view_city', 'view_panorama', 'search', 'view_home');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "language" "Language" NOT NULL DEFAULT 'en',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "personality_type" "PersonalityType" NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "governorate_ar" TEXT NOT NULL,
    "description_en" TEXT,
    "description_ar" TEXT,
    "thumbnail_url" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monument" (
    "id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "subcategory" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "thumbnail_url" TEXT,
    "entry_fee" TEXT,
    "opening_hours" TEXT,
    "tags" TEXT[],
    "kind" "MonumentKind" NOT NULL DEFAULT 'monument',
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panorama" (
    "id" UUID NOT NULL,
    "monument_id" UUID NOT NULL,
    "url_low" TEXT NOT NULL,
    "url_medium" TEXT NOT NULL,
    "url_high" TEXT NOT NULL,
    "narration_url_en" TEXT,
    "narration_url_ar" TEXT,
    "camera_bounds" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panorama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotspot" (
    "id" UUID NOT NULL,
    "panorama_id" UUID NOT NULL,
    "pos_x" DOUBLE PRECISION NOT NULL,
    "pos_y" DOUBLE PRECISION NOT NULL,
    "pos_z" DOUBLE PRECISION NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotspot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "asset_type" "MediaAssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption_en" TEXT,
    "caption_ar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_event" (
    "id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "image_url" TEXT,
    "year" INTEGER NOT NULL,
    "era" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awareness_card" (
    "id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "card_type" "AwarenessCardType" NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awareness_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "stars" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city_id" UUID,
    "monument_id" UUID,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interaction" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" "InteractionEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "action_type" "InteractionActionType" NOT NULL,
    "duration_seconds" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "source_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_snapshot" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToMonument" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryToMonument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_family_id_idx" ON "session"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "personality_profile_user_id_key" ON "personality_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "city_slug_key" ON "city"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "monument_slug_key" ON "monument"("slug");

-- CreateIndex
CREATE INDEX "monument_city_id_idx" ON "monument"("city_id");

-- CreateIndex
CREATE INDEX "monument_kind_idx" ON "monument"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "panorama_monument_id_key" ON "panorama"("monument_id");

-- CreateIndex
CREATE INDEX "hotspot_panorama_id_idx" ON "hotspot"("panorama_id");

-- CreateIndex
CREATE INDEX "media_asset_city_id_idx" ON "media_asset"("city_id");

-- CreateIndex
CREATE INDEX "media_asset_monument_id_idx" ON "media_asset"("monument_id");

-- CreateIndex
CREATE INDEX "timeline_event_city_id_idx" ON "timeline_event"("city_id");

-- CreateIndex
CREATE INDEX "timeline_event_monument_id_idx" ON "timeline_event"("monument_id");

-- CreateIndex
CREATE INDEX "awareness_card_city_id_idx" ON "awareness_card"("city_id");

-- CreateIndex
CREATE INDEX "awareness_card_monument_id_idx" ON "awareness_card"("monument_id");

-- CreateIndex
CREATE INDEX "favorite_user_id_idx" ON "favorite"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_city_id_key" ON "favorite"("user_id", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_monument_id_key" ON "favorite"("user_id", "monument_id");

-- CreateIndex
CREATE INDEX "rating_city_id_idx" ON "rating"("city_id");

-- CreateIndex
CREATE INDEX "rating_monument_id_idx" ON "rating"("monument_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_user_id_city_id_key" ON "rating"("user_id", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_user_id_monument_id_key" ON "rating"("user_id", "monument_id");

-- CreateIndex
CREATE INDEX "report_user_id_idx" ON "report"("user_id");

-- CreateIndex
CREATE INDEX "report_city_id_idx" ON "report"("city_id");

-- CreateIndex
CREATE INDEX "report_monument_id_idx" ON "report"("monument_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_interaction_event_id_key" ON "user_interaction"("event_id");

-- CreateIndex
CREATE INDEX "user_interaction_entity_type_entity_id_idx" ON "user_interaction"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "user_interaction_user_id_created_at_idx" ON "user_interaction"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_session_user_id_idx" ON "chat_session"("user_id");

-- CreateIndex
CREATE INDEX "chat_message_session_id_created_at_idx" ON "chat_message"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "recommendation_snapshot_user_id_generated_at_idx" ON "recommendation_snapshot"("user_id", "generated_at");

-- CreateIndex
CREATE INDEX "_CategoryToMonument_B_index" ON "_CategoryToMonument"("B");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_profile" ADD CONSTRAINT "personality_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monument" ADD CONSTRAINT "monument_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panorama" ADD CONSTRAINT "panorama_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotspot" ADD CONSTRAINT "hotspot_panorama_id_fkey" FOREIGN KEY ("panorama_id") REFERENCES "panorama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awareness_card" ADD CONSTRAINT "awareness_card_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awareness_card" ADD CONSTRAINT "awareness_card_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_snapshot" ADD CONSTRAINT "recommendation_snapshot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMonument" ADD CONSTRAINT "_CategoryToMonument_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMonument" ADD CONSTRAINT "_CategoryToMonument_B_fkey" FOREIGN KEY ("B") REFERENCES "monument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ADR-007: exclusive nullable FK CHECK constraints
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE "rating" ADD CONSTRAINT "rating_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE "report" ADD CONSTRAINT "report_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE "awareness_card" ADD CONSTRAINT "awareness_card_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_arc_chk" CHECK (num_nonnulls(city_id, monument_id) = 1);
