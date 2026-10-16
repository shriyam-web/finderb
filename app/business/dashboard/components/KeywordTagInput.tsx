'use client';

import { useEffect, useState } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import {
  getSearchKeywordsImpact,
  MAX_SEARCH_KEYWORDS,
  normalizeSearchKeywords,
} from '@/lib/businessKeywords';

type KeywordTagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  max?: number;
  placeholder?: string;
};

export default function KeywordTagInput({
  value,
  onChange,
  suggestions = [],
  max = MAX_SEARCH_KEYWORDS,
  placeholder = 'Type a keyword and press comma',
}: KeywordTagInputProps) {
  const [draft, setDraft] = useState('');
  const tags = normalizeSearchKeywords(value).slice(0, max);
  const atLimit = tags.length >= max;
  const impact = getSearchKeywordsImpact(tags.length);

  useEffect(() => {
    setDraft('');
  }, [value]);

  const commitTags = (nextTags: string[]) => {
    onChange(normalizeSearchKeywords(nextTags));
  };

  const removeTag = (index: number) => {
    commitTags(tags.filter((_, itemIndex) => itemIndex !== index));
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

    commitTags([...tags, piece]);
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
    <div className="space-y-3">
      <div className="rounded-lg border border-[#3F3F46]/15 bg-[#3F3F46]/[0.04] px-3 py-2.5 text-sm">
        <p className="font-medium text-[#27272A]">{impact.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">{impact.message}</p>
      </div>

      <p className="text-xs text-zinc-500">
        Type and press comma to add a tag. Up to {max}.
      </p>

      <div className="min-h-[42px] rounded-lg border border-zinc-200 bg-white px-2 py-2 focus-within:border-[#3F3F46] focus-within:ring-2 focus-within:ring-[#3F3F46]/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 rounded-md bg-[#f9b864]/20 px-2 py-1 text-xs font-medium text-[#27272A]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="rounded p-0.5 text-[#27272A]/70 hover:bg-[#f9b864]/30 hover:text-[#27272A]"
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
            placeholder={atLimit ? 'Maximum reached' : tags.length ? 'Add another…' : placeholder}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {suggestions.length ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((item) => !tags.some((tag) => tag.toLowerCase() === item.toLowerCase()))
            .filter((item) => !draft.trim() || item.toLowerCase().includes(draft.trim().toLowerCase()))
            .slice(0, 8)
            .map((item) => (
              <button
                key={item}
                type="button"
                disabled={atLimit}
                onClick={() => commitTags([...tags, item])}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-40"
              >
                {item}
              </button>
            ))}
        </div>
      ) : null}

      <p className="text-xs text-zinc-500">
        {tags.length}/{max}
      </p>
    </div>
  );
}
