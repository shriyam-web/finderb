'use client';

import { useState } from 'react';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineInbox,
  HiOutlineUserGroup,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';

interface MessagesTabProps {
  businessId: string;
}

type InboxView = 'inbox' | 'customers';

export default function MessagesTab({ businessId }: MessagesTabProps) {
  const [view, setView] = useState<InboxView>('inbox');

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[480px] flex-col gap-4 lg:h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
          <p className="text-sm text-slate-500">Customer enquiries and conversations in one place</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setView('inbox')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'inbox'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HiOutlineInbox size={15} />
            Inbox
          </button>
          <button
            type="button"
            onClick={() => setView('customers')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'customers'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HiOutlineUserGroup size={15} />
            Customers
          </button>
        </div>
      </div>

      {/* Inbox layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {/* Thread list */}
        <div className="flex w-full flex-col border-r border-slate-100 sm:w-72 lg:w-80">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              {view === 'inbox' ? 'Recent threads' : 'Saved contacts'}
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              {view === 'inbox' ? (
                <HiOutlineChatBubbleLeftRight size={22} />
              ) : (
                <HiOutlineUserGroup size={22} />
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {view === 'inbox' ? 'Inbox is empty' : 'No customers saved yet'}
            </p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500">
              {view === 'inbox'
                ? 'When someone messages your business, the thread will show up here.'
                : 'People you’ve chatted with will appear in this list.'}
            </p>
          </div>
        </div>

        {/* Conversation pane — hidden on small screens when empty */}
        <div className="hidden flex-1 flex-col sm:flex">
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <HiOutlineChatBubbleLeftRight size={40} className="text-slate-200" strokeWidth={1.25} />
            <p className="mt-4 text-sm font-medium text-slate-700">Select a conversation</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Pick a thread from the left to read and reply. New leads from your profile also appear in{' '}
              <span className="font-medium text-slate-700">Lead center</span>.
            </p>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="mx-auto flex max-w-2xl items-end gap-2 opacity-50">
              <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                Type a reply…
              </div>
              <button
                type="button"
                disabled
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white"
                aria-label="Send message"
              >
                <HiOutlinePaperAirplane size={18} />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-slate-400">
              Direct messaging is coming soon · Business ID: {businessId.slice(0, 8)}…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
