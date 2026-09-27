import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = (name: string) => readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8");

describe("database security contracts", () => {
  it("uses immutable UUID relationships and keeps code history separate", () => {
    const sql = migration("202609260001_initial_pilot.sql");
    expect(sql).toContain("participant_codes");
    expect(sql).toContain("participant_id uuid not null references participants(id)");
    expect(sql).toContain("one_active_code_per_participant");
    expect(sql).toContain("participant_id uuid references participants(id)");
  });
  it("rejects ambiguous participant-code characters", () => {
    expect(migration("202609260002_exclude_ambiguous_code_characters.sql")).toMatch(/A-HJ-KM-NP-Z2-9/);
  });
  it("limits sensitive RPCs to the service role", () => {
    const sql = migration("202609260005_secure_store_access.sql");
    expect(sql).toContain("revoke execute on function open_store_session");
    expect(sql).toContain("revoke execute on function set_station_pin");
    expect(sql).toContain("grant execute on function set_station_pin(uuid, text) to service_role");
  });
  it("enforces order capacity, slot closure and RLS in SQL", () => {
    const sql = migration("202609260001_initial_pilot.sql");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("slot is full");
    expect(sql).toContain("alter table orders enable row level security");
  });
  it("adds operational station settings without public feature flags", () => {
    expect(migration("202609260006_store_operations.sql")).toContain("sound_enabled boolean not null default false");
    expect(migration("202609260006_store_operations.sql")).toContain("daily_log_url text");
  });
  it("makes a waitlist email unique after normalization and issues vouchers server-side", () => {
    const sql = migration("202609260007_waitlist_signup.sql");
    expect(sql).toContain("waitlist_entries_email_normalized_unique");
    expect(sql).toContain("lower(trim(email))");
    expect(sql).toContain("create_waitlist_signup");
    expect(sql).toContain("insert into vouchers");
    expect(sql).toContain("exception when unique_violation");
  });
  it("keeps the waitlist RPC and rate-limit storage unavailable to browser roles", () => {
    const sql = migration("202609260007_waitlist_signup.sql");
    expect(sql).toContain("alter table waitlist_attempts enable row level security");
    expect(sql).toContain("revoke execute on function create_waitlist_signup");
    expect(sql).toContain("to service_role");
  });
  it("limits realtime order updates to the JWT station claim", () => {
    const sql = migration("202609260008_store_realtime.sql");
    expect(sql).toContain("store_realtime_orders_read");
    expect(sql).toContain("store_station_id");
    expect(sql).toContain("alter publication supabase_realtime add table orders");
  });
  it("keeps functional pilot flags in a protected database table", () => {
    const sql = migration("202609260009_pilot_feature_flags.sql");
    expect(sql).toContain("create table pilot_feature_flags");
    expect(sql).toContain("alter table pilot_feature_flags enable row level security");
    expect(sql).toContain("'ordering', false");
  });
  it("records participant self-redemptions atomically and keeps the seed free of invented operating data", () => {
    const sql = migration("202609270010_participant_redemptions.sql");
    const seed = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
    expect(sql).toContain("record_self_redemption");
    expect(sql).toContain("daily redemption limit reached");
    expect(sql).toContain("to service_role");
    expect(seed).toContain("('AMF', 'Amersfoort')");
    expect(seed).not.toContain("insert into products");
    expect(seed).not.toContain("opening_hours");
  });

  it("records one daily question per Amsterdam pilot day through a service-only RPC", () => {
    const sql = migration("202609270014_daily_questions.sql");
    expect(sql).toContain("interval '4 hours'");
    expect(sql).toContain("daily question already answered");
    expect(sql).toContain("daily_question_answered");
    expect(sql).toContain("to service_role");
  });

  it("keeps weekly completion behind an administrator-only RPC", () => {
    const sql = migration("202609270015_admin_weekly_questions.sql");
    expect(sql).toContain("completed_by_admin_id");
    expect(sql).toContain("actor_type, actor_id");
    expect(sql).toContain("to service_role");
  });

  it("accepts pickup feedback only once for the participant's collected order", () => {
    const sql = migration("202609270016_order_feedback.sql");
    expect(sql).toContain("participant_id = p_participant_id");
    expect(sql).toContain("status = 'collected'");
    expect(sql).toContain("smiley is null");
  });
  it("rotates participant codes atomically and only through the service role", () => {
    const sql = migration("202609270011_atomic_participant_code_rotation.sql");
    expect(sql).toContain("for update");
    expect(sql).toContain("participant_code_rotated");
    expect(sql).toContain("to service_role");
  });
  it("keeps slot claims, cancellation and anonymization in protected database functions", () => {
    const sql = migration("202609270012_ordering_and_anonymization.sql");
    expect(sql).toContain("ordering is disabled");
    expect(sql).toContain("slot is outside opening hours");
    expect(sql).toContain("daily order limit reached");
    expect(sql).toContain("product is unavailable");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("cancel_participant_order");
    expect(sql).toContain("anonymize_pilot_personal_data");
    expect(sql).toContain("first_name = null");
    expect(sql).toContain("email = null");
    expect(sql).toContain("personal_data_anonymized");
    expect(sql).toContain("retention period has not ended");
    expect(sql).toContain("events_append_only");
    expect(sql).toContain("to service_role");
  });
  it("keeps participant extensions server-only and tied to immutable participant IDs", () => {
    const sql = migration("202609270013_participant_extensions.sql");
    expect(sql).toContain("weekly_question_statuses");
    expect(sql).toContain("card_photos");
    expect(sql).toContain("record_digital_stamp");
    expect(sql).toContain("convert_waitlist_entry");
    expect(sql).toContain("to service_role");
    expect(sql).toContain("storage.buckets");
  });
});
