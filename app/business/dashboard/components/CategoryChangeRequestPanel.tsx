'use client';

import { useEffect, useMemo, useState } from 'react';
import { HiOutlineTag } from 'react-icons/hi2';
import { Briefcase } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { SearchableSelect, type SelectOption } from '@/components/SearchableSelect';
import { getCategories, getSubCategories } from '@/app/actions/category';
import {
  getPendingChangeRequest,
  submitCategoryChangeRequest,
} from '@/app/actions/businessChangeRequests';
import { CATEGORY_CHANGE_FIELD } from '@/lib/businessChangeRequest';
import type { BusinessChangeRequest } from '@/lib/businessChangeRequest';
import {
  joinBusinessCategories,
  splitBusinessCategories,
} from '@/lib/categoryTree';
import { dashboard } from './dashboard-ui';

type LiveCategory = { id: string; name: string; icon?: string | null };

type CategoryChangeRequestPanelProps = {
  businessId: string;
  currentCategory: string;
  onPendingChange?: (request: BusinessChangeRequest | null) => void;
};

function buildCategoryLabel(parentName: string, subName?: string) {
  return subName ? `${parentName} › ${subName}` : parentName;
}

export default function CategoryChangeRequestPanel({
  businessId,
  currentCategory,
  onPendingChange,
}: CategoryChangeRequestPanelProps) {
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [subCategories, setSubCategories] = useState<LiveCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingPending, setLoadingPending] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BusinessChangeRequest | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [requestedLabels, setRequestedLabels] = useState<string[]>([]);
  const [merchantNote, setMerchantNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingCategories(true);
      setLoadingPending(true);

      const [categoriesResult, pendingResult] = await Promise.all([
        getCategories(true),
        getPendingChangeRequest(businessId, CATEGORY_CHANGE_FIELD),
      ]);

      if (cancelled) return;

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories as LiveCategory[]);
      } else {
        setCategories([]);
      }

      if (pendingResult.success) {
        setPendingRequest(pendingResult.request);
        onPendingChange?.(pendingResult.request);
      }

      setLoadingCategories(false);
      setLoadingPending(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubcategoryId('');
      return;
    }

    let cancelled = false;
    setLoadingSubcategories(true);

    getSubCategories(categoryId).then((result) => {
      if (cancelled) return;
      if (result.success && result.subCategories) {
        setSubCategories(result.subCategories as LiveCategory[]);
      } else {
        setSubCategories([]);
      }
      setSubcategoryId('');
      setLoadingSubcategories(false);
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
        prefix: <CategoryIcon name={category.name} icon={category.icon} size={18} />,
      })),
    [categories],
  );

  const subcategoryOptions: SelectOption[] = useMemo(
    () =>
      subCategories.map((category) => ({
        label: category.name,
        value: category.id,
        prefix: <CategoryIcon name={category.name} icon={category.icon} size={18} />,
      })),
    [subCategories],
  );

  const selectedParent = categories.find((item) => item.id === categoryId);
  const selectedSub = subCategories.find((item) => item.id === subcategoryId);
  const showSubcategory = Boolean(categoryId && subCategories.length > 0);
  const draftCategory = selectedParent
    ? buildCategoryLabel(selectedParent.name, selectedSub?.name)
    : '';
  const requestedCategory = joinBusinessCategories([
    ...requestedLabels,
    ...(draftCategory &&
    (!showSubcategory || subcategoryId) &&
    !requestedLabels.some((l) => l.toLowerCase() === draftCategory.toLowerCase())
      ? [draftCategory]
      : []),
  ]);

  const addDraftCategory = () => {
    if (!draftCategory) {
      setError('Please select a category.');
      return;
    }
    if (showSubcategory && !subcategoryId) {
      setError('Please select a subcategory.');
      return;
    }
    setRequestedLabels((prev) =>
      splitBusinessCategories(joinBusinessCategories([...prev, draftCategory])),
    );
    setCategoryId('');
    setSubcategoryId('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const finalRequested = joinBusinessCategories([
      ...requestedLabels,
      ...(draftCategory && (!showSubcategory || subcategoryId)
        ? [draftCategory]
        : []),
    ]);

    if (!finalRequested) {
      setError('Please add at least one category.');
      return;
    }

    if (draftCategory && showSubcategory && !subcategoryId && requestedLabels.length === 0) {
      setError('Please select a subcategory.');
      return;
    }

    setSubmitting(true);
    const result = await submitCategoryChangeRequest({
      businessId,
      requestedCategory: finalRequested,
      merchantNote,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPendingRequest(result.request);
    onPendingChange?.(result.request);
    setCategoryId('');
    setSubcategoryId('');
    setRequestedLabels([]);
    setMerchantNote('');
    setSuccess('Your category change request was submitted. We will review it shortly.');
  };

  if (loadingPending) {
    return (
      <div className={`${dashboard.emptyState} py-10`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3F3F46] border-t-transparent" />
        <p className="mt-3 text-sm text-zinc-500">Loading category settings…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Current categories</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {splitBusinessCategories(currentCategory).length ? (
            splitBusinessCategories(currentCategory).map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-[#27272A]"
              >
                <HiOutlineTag size={12} className="text-zinc-400" />
                {label}
              </span>
            ))
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-[#27272A]">
              <HiOutlineTag size={16} className="shrink-0 text-zinc-400" />
              Not set
            </p>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Your categories cannot be changed directly. Submit a request and our team will review it from the admin panel. You can request multiple categories.
        </p>
      </div>

      {pendingRequest ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-semibold">Change request pending review</p>
          <p className="mt-1 text-xs leading-relaxed">
            Requested: <span className="font-medium">{pendingRequest.requested_value}</span>
          </p>
          <p className="mt-1 text-xs text-amber-800/90">
            Submitted {new Date(pendingRequest.created_at).toLocaleString()}. You can submit a new request after this one is reviewed.
          </p>
        </div>
      ) : (
        <>
          <SearchableSelect
            label="Request new category"
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            placeholder={loadingCategories ? 'Loading categories…' : 'Select category'}
            icon={<Briefcase size={17} />}
            disabled={loadingCategories}
            loading={loadingCategories}
          />

          {showSubcategory && (
            <SearchableSelect
              label="Subcategory"
              options={subcategoryOptions}
              value={subcategoryId}
              onChange={setSubcategoryId}
              placeholder={loadingSubcategories ? 'Loading subcategories…' : 'Select subcategory'}
              icon={<Briefcase size={17} />}
              disabled={!categoryId || loadingSubcategories}
              loading={loadingSubcategories}
            />
          )}

          {requestedLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {requestedLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-[#3F3F46]/20 bg-[#3F3F46]/[0.06] px-2 py-0.5 text-xs font-medium text-[#27272A]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() =>
                      setRequestedLabels((prev) =>
                        prev.filter((item) => item.toLowerCase() !== label.toLowerCase()),
                      )
                    }
                    className="text-zinc-500 hover:text-[#27272A]"
                    aria-label={`Remove ${label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {draftCategory ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#3F3F46]/15 bg-[#3F3F46]/[0.04] px-3 py-2.5 text-xs text-zinc-700">
              <span className="min-w-0 truncate">
                Ready to add:{' '}
                <span className="font-semibold text-[#27272A]">{draftCategory}</span>
              </span>
              <button
                type="button"
                onClick={addDraftCategory}
                className="shrink-0 rounded-md bg-[#3F3F46] px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                Add
              </button>
            </div>
          ) : null}

          {requestedCategory && (
            <div className="rounded-lg border border-[#3F3F46]/15 bg-[#3F3F46]/[0.04] px-3 py-2.5 text-xs text-zinc-700">
              Request will include:{' '}
              <span className="font-semibold text-[#27272A]">
                {splitBusinessCategories(requestedCategory).join(' · ')}
              </span>
            </div>
          )}

          <div>
            <label htmlFor="category-change-note" className="mb-1 block text-xs font-medium text-zinc-600">
              Why do you need this change? (optional)
            </label>
            <textarea
              id="category-change-note"
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              rows={3}
              placeholder="e.g. We expanded from retail into wholesale…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {success && <p className="text-xs text-emerald-700">{success}</p>}

          <button
            type="submit"
            disabled={submitting || !requestedCategory}
            className={`w-full ${dashboard.btnPrimary} disabled:opacity-50`}
          >
            {submitting ? 'Submitting…' : 'Submit change request'}
          </button>
        </>
      )}
    </form>
  );
}
