'use client';

import { useEffect, useState } from 'react';
import { getAlsoServesState, saveAlsoServes } from '@/app/actions/alsoServes';
import { MAX_SUBCATEGORIES_PER_CATEGORY } from '@/lib/alsoServes';

export default function AlsoServesEditor({
  businessId,
  onSaved,
}: {
  businessId: string;
  onSaved?: (category: string) => void;
}) {
  const [primary, setPrimary] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getAlsoServesState(businessId).then((result) => {
      if (result.success && 'state' in result) {
        setPrimary(result.state.primary);
        setOptions(result.state.options);
        setSelected(result.state.selected);
      }
      setReady(true);
    });
  }, [businessId]);

  if (!open) {
    return (
      <div className="border-t border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left text-sm font-semibold text-[#153551] underline-offset-2 hover:underline"
        >
          Business works in more categories? Add it here.
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="border-t border-zinc-100 px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">Business works in more categories? Add it here.</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">Loading other subcategories in this category.</p>
      </div>
    );
  }

  const room = MAX_SUBCATEGORIES_PER_CATEGORY - 1;

  const toggle = async (leaf: string) => {
    const has = selected.some((item) => item.toLowerCase() === leaf.toLowerCase());
    if (!has && selected.length >= room) {
      setNote(`You can list up to ${MAX_SUBCATEGORIES_PER_CATEGORY} subcategories in this category, including the one you already have.`);
      return;
    }
    const next = has ? selected.filter((item) => item.toLowerCase() !== leaf.toLowerCase()) : [...selected, leaf];
    setBusy(true);
    setNote('');
    const result = await saveAlsoServes(businessId, next);
    setBusy(false);
    if (!result.success) {
      setNote(result.error);
      return;
    }
    setSelected(next);
    onSaved?.(result.category);
    setNote('Saved. These categories are live.');
  };

  return (
    <div className="border-t border-zinc-100 px-4 py-3">
      <p className="text-sm font-medium text-zinc-900">Business works in more categories? Add it here.</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        {options.length
          ? `${primary} stays your category. Add other subcategories in that same category, up to ${MAX_SUBCATEGORIES_PER_CATEGORY} in total.`
          : 'This category has no other subcategories to add.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((leaf) => {
          const active = selected.some((item) => item.toLowerCase() === leaf.toLowerCase());
          return (
            <button
              key={leaf}
              type="button"
              disabled={busy}
              onClick={() => void toggle(leaf)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {leaf}
            </button>
          );
        })}
      </div>
      {note ? <p className="mt-2 text-xs text-zinc-500">{note}</p> : null}
    </div>
  );
}
