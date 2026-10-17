'use client';

import { useRef } from 'react';

const MARKS = [
  { token: '**', label: 'B', title: 'Bold' },
  { token: '*', label: 'I', title: 'Italic' },
  { token: '__', label: 'U', title: 'Underline' },
] as const;

export default function AboutEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = (token: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const before = value.slice(Math.max(0, start - token.length), start);
    const after = value.slice(end, end + token.length);
    const removing = before === token && after === token;
    const next = removing
      ? value.slice(0, start - token.length) + selected + value.slice(end + token.length)
      : `${value.slice(0, start)}${token}${selected}${token}${value.slice(end)}`;
    const cursor = removing ? start - token.length : start + token.length;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor + selected.length);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {MARKS.map((mark) => (
          <button
            key={mark.title}
            type="button"
            title={mark.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => apply(mark.token)}
            className={`rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-800 hover:bg-zinc-50 ${
              mark.title === 'Bold' ? 'font-bold' : mark.title === 'Italic' ? 'italic' : 'underline'
            }`}
          >
            {mark.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
      />
      <p className="text-xs text-zinc-500">Line breaks, bold, italic, and underline show on your public page.</p>
    </div>
  );
}
