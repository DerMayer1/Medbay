"use client";

import { FormEvent, useState } from "react";

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
      <form onSubmit={handleCreate} className="rounded-lg border border-[#d9ded6] bg-white p-5">
        <h2 className="text-lg font-semibold">Novo item</h2>
        <label className="mt-4 block text-sm font-medium">
          Categoria
          <select name="category" className="mt-2 w-full rounded-md border border-[#c7d0c8] px-3 py-2">
            <option value="general">Geral</option>
            <option value="prices">Valores</option>
            <option value="location">Endereço</option>
            <option value="hours">Horários</option>
            <option value="online_consultation">Consulta online</option>
            <option value="in_person_consultation">Consulta presencial</option>
            <option value="return_consultation">Retorno</option>
            <option value="cancellation">Cancelamento</option>
            <option value="exams">Exames</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium">
          Título
          <input name="title" required className="mt-2 w-full rounded-md border border-[#c7d0c8] px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Conteúdo
          <textarea
            name="content"
            required
            rows={6}
            className="mt-2 w-full rounded-md border border-[#c7d0c8] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 rounded-md bg-[#176b4d] px-4 py-2 text-sm font-semibold text-white"
        >
          Salvar item
        </button>
      </form>

      <div className="space-y-3">
        {localItems.map((item) => (
          <article key={String(item.id)} className="rounded-lg border border-[#d9ded6] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#176b4d]">{String(item.category)}</p>
                <h3 className="mt-1 text-lg font-semibold">{String(item.title)}</h3>
              </div>
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className="rounded-md border border-[#c7d0c8] px-3 py-2 text-xs font-semibold"
              >
                {item.active ? "Desativar" : "Ativar"}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#52605b]">{String(item.content)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
