'use client';

import { useEffect, useState } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import {
  MAX_SERVICE_CATEGORIES,
  parseBusinessServices,
  serializeBusinessServices,
} from '@/lib/parseBusinessServices';

type ServiceCategoryTagInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ServiceCategoryTagInput({ value, onChange }: ServiceCategoryTagInputProps) {
  const [draft, setDraft] = useState('');
  const tags = parseBusinessServices(value);
  const atLimit = tags.length >= MAX_SERVICE_CATEGORIES;

  useEffect(() => {
    setDraft('');
  }, [value]);

  const removeTag = (index: number) => {
    const next = tags.filter((_, itemIndex) => itemIndex !== index);
    onChange(serializeBusinessServices(next));
  };

  const commitDraft = (raw: string) => {
    const piece = raw.replace(/,+$/, '').trim();
    if (!piece || atLimit) {
      setDraft('');
      return;
    }

    if (tags.some((tag) => tag.toLowerCase() === piece.toLowerCase())) {
      setDraft('');
      return;
    }

    onChange(serializeBusinessServices([...tags, piece]));
    setDraft('');
  };

  const handleDraftChange = (nextValue: string) => {
    if (!nextValue.includes(',')) {
      setDraft(nextValue);
      return;
    }

    const parts = nextValue.split(',');
    const trailing = parts.pop() ?? '';
    for (const part of parts) {
      commitDraft(part);
    }
    setDraft(trailing);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      commitDraft(draft);
      return;
    }

    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Type a service and press comma to add it. Up to {MAX_SERVICE_CATEGORIES} categories.
      </p>
      <div className="min-h-[42px] rounded-lg border border-zinc-200 bg-white px-2 py-2 focus-within:border-[#215481] focus-within:ring-2 focus-within:ring-[#215481]/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 rounded-md bg-[#215481]/8 px-2 py-1 text-xs font-medium text-[#153551]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="rounded p-0.5 text-[#215481]/70 hover:bg-[#215481]/10 hover:text-[#153551]"
                aria-label={`Remove ${tag}`}
              >
                <HiOutlineXMark size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={draft}
            disabled={atLimit}
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => commitDraft(draft)}
            placeholder={atLimit ? 'Maximum reached' : tags.length ? 'Add another…' : 'e.g. Home delivery'}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        {tags.length}/{MAX_SERVICE_CATEGORIES} categories
      </p>
    </div>
  );
}
