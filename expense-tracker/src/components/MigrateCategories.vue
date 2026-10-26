<script setup>
// TEMPORARY one-off tool: moves legacy free-text categories into notes and sets category to
// "Uncategorized". Open the app with ?migrate=1. Remove this component once the run is done.
import { ref } from "vue";
import { db } from "../firebase";
import { DEFAULT_CATEGORY, categoryKey } from "../categories";

const props = defineProps({ user: Object });
defineEmits(["close"]);

const KEEP = new Set([DEFAULT_CATEGORY, "clubM"].map(categoryKey));

const docs = ref([]); // all of the user's expenses, as {id, ...data}
const plan = ref(null); // null = not scanned; else [{id, date, oldCategory, notes}]
const status = ref("");
const busy = ref(false);

async function scan() {
  busy.value = true;
  status.value = "Scanning…";
  try {
    const snap = await db.collection("expenses").where("uid", "==", props.user.uid).get();
    docs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    plan.value = docs.value
      .filter((e) => (e.category || "").trim() && !KEEP.has(categoryKey(e.category)))
      .map((e) => {
        const old = e.category.trim();
        const existing = (e.notes || "").trim();
        return { id: e.id, date: e.date, oldCategory: old, notes: existing ? `${old} — ${existing}` : old };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    status.value = `${docs.value.length} expenses scanned, ${plan.value.length} to migrate.`;
  } catch (err) {
    status.value = `Scan failed: ${err.message}`;
  } finally {
    busy.value = false;
  }
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(docs.value, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `expenses-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function apply() {
  if (!plan.value?.length) return;
  if (!confirm(`Migrate ${plan.value.length} expenses? A backup will download first.`)) return;
  busy.value = true;
  try {
    downloadBackup();
    for (let i = 0; i < plan.value.length; i += 400) {
      status.value = `Writing ${Math.min(i + 400, plan.value.length)} / ${plan.value.length}…`;
      const batch = db.batch();
      for (const p of plan.value.slice(i, i + 400)) {
        batch.update(db.collection("expenses").doc(p.id), { category: DEFAULT_CATEGORY, notes: p.notes });
      }
      await batch.commit();
    }
    status.value = `Done: ${plan.value.length} migrated. Reload the page.`;
    plan.value = [];
  } catch (err) {
    status.value = `Failed: ${err.message} (batches already committed stay applied; re-scan to see what's left)`;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Migrate categories → notes</h3>
      <p>Skips Uncategorized, clubM and blanks. Every other category (presets too) moves to notes and is reset to Uncategorized.</p>
      <button :disabled="busy" @click="scan">Scan (dry run)</button>
      <button v-if="plan?.length" :disabled="busy" @click="apply">Apply</button>
      <button @click="$emit('close')">Close</button>
      <p>{{ status }}</p>
      <table v-if="plan?.length">
        <thead><tr><th>Date</th><th>Old category</th><th>New notes</th></tr></thead>
        <tbody>
          <tr v-for="p in plan" :key="p.id"><td>{{ p.date }}</td><td>{{ p.oldCategory }}</td><td>{{ p.notes }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
