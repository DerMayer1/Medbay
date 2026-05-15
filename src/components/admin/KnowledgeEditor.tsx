"use client";

import { FormEvent, useState } from "react";

const categories = ["services", "pricing", "schedule", "policies", "faq", "safety"];

export function KnowledgeEditor({ items }: { items: Array<Record<string, unknown>> }) {
  const [localItems, setLocalItems] = useState(items);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        title: form.get("title"),
        content: form.get("content"),
        active: true,
      }),
    });
    const item = await response.json();
    setLocalItems((current) => [item, ...current]);
    event.currentTarget.reset();
    setIsSaving(false);
  }

  async function toggleItem(item: Record<string, unknown>) {
    const response = await fetch(`/api/knowledge/${String(item.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    const updated = await response.json();
    setLocalItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">New knowledge item</h2>
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Category
          <select name="category" className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Title
          <input name="title" required className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Content
          <textarea
            name="content"
            required
            rows={6}
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2"
          />
        </label>
        <button type="submit" disabled={isSaving} className="mt-5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Save item
        </button>
      </form>

      <div className="space-y-3">
        {localItems.map((item) => (
          <article key={String(item.id)} className="rounded-xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{String(item.category)}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{String(item.title)}</h3>
              </div>
              <button type="button" onClick={() => toggleItem(item)} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
                {item.active ? "Disable" : "Enable"}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{String(item.content)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
