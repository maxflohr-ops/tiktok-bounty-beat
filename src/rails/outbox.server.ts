// Supabase-backed whop_outbox store. SERVER-ONLY — uses the service-role
// client; lazy-import from server handlers, never from client-reachable code.
// The whop_outbox table is not in the generated Database types until the next
// type regen, hence the narrow casts.

import type { OutboxRow, OutboxStore } from "./rail";

type DbOutboxRow = {
  kind: string;
  ref_table: string;
  ref_id: string;
  idempotency_key: string;
  request: unknown;
  response: unknown | null;
  status: OutboxRow["status"];
  created_at: string;
  sent_at: string | null;
};

function toRow(db: DbOutboxRow): OutboxRow {
  return {
    kind: db.kind,
    refTable: db.ref_table,
    refId: db.ref_id,
    idempotencyKey: db.idempotency_key,
    request: db.request,
    response: db.response ?? undefined,
    status: db.status,
    createdAt: db.created_at,
    sentAt: db.sent_at ?? undefined,
  };
}

export async function createSupabaseOutbox(): Promise<OutboxStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table absent from generated types until next regen
  const table = () => (supabaseAdmin as unknown as { from(t: string): any }).from("whop_outbox");

  return {
    async find(idempotencyKey) {
      const { data, error } = await table()
        .select("kind,ref_table,ref_id,idempotency_key,request,response,status,created_at,sent_at")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (error) throw new Error(`whop_outbox read failed: ${error.message}`);
      return data ? toRow(data as DbOutboxRow) : null;
    },

    // The UNIQUE index on idempotency_key is the real guard: a concurrent
    // duplicate insert fails here and moveMoney re-reads the winning row.
    async insert(row) {
      const { error } = await table().insert({
        kind: row.kind,
        ref_table: row.refTable,
        ref_id: row.refId,
        idempotency_key: row.idempotencyKey,
        request: row.request,
        status: row.status,
        created_at: row.createdAt,
        sent_at: row.sentAt ?? null,
      });
      if (error) throw new Error(`whop_outbox insert failed: ${error.message}`);
    },

    async update(idempotencyKey, patch) {
      const { error } = await table()
        .update({
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.response !== undefined ? { response: patch.response } : {}),
          ...(patch.sentAt !== undefined ? { sent_at: patch.sentAt } : {}),
        })
        .eq("idempotency_key", idempotencyKey);
      if (error) throw new Error(`whop_outbox update failed: ${error.message}`);
    },
  };
}
