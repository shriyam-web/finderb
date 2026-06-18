'use client';

import { useState } from 'react';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineInbox,
  HiOutlineUserGroup,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';
import { dashboard } from './dashboard-ui';

interface MessagesTabProps {
  businessId: string;
}

type InboxView = 'inbox' | 'customers';

export default function MessagesTab({ businessId }: MessagesTabProps) {
  const [view, setView] = useState<InboxView>('inbox');

  return (
    <div className="flex min-h-[480px] flex-col gap-4 lg:min-h-[calc(100vh-14rem)]">
      <div className={`${dashboard.segmentGroup}`}>
        <button
          type="button"
          onClick={() => setView('inbox')}
          className={`${dashboard.segmentBtn} ${view === 'inbox' ? dashboard.segmentActive : dashboard.segmentInactive}`}
        >
          <HiOutlineInbox size={15} />
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setView('customers')}
          className={`${dashboard.segmentBtn} ${view === 'customers' ? dashboard.segmentActive : dashboard.segmentInactive}`}
        >
          <HiOutlineUserGroup size={15} />
          Customers
        </button>
      </div>

      <div className={`flex min-h-0 flex-1 ${dashboard.surface}`}>
        <div className="flex w-full flex-col border-r border-zinc-100 sm:w-72 lg:w-80">
          <div className="border-b border-zinc-100 px-4 py-3 text-xs font-medium text-zinc-500">
            {view === 'inbox' ? 'Recent threads' : 'Saved contacts'}
          </div>
          <div className={`flex flex-1 flex-col ${dashboard.emptyState}`}>
            <HiOutlineChatBubbleLeftRight size={28} className="text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">
              {view === 'inbox' ? 'Inbox is empty' : 'No customers saved yet'}
            </p>
            <p className="mt-1 max-w-[220px] text-xs text-zinc-500">
              {view === 'inbox'
                ? 'When someone messages your business, the thread will show up here.'
                : "People you've chatted with will appear in this list."}
            </p>
          </div>
        </div>

        <div className="hidden flex-1 flex-col sm:flex">
          <div className={`flex flex-1 flex-col ${dashboard.emptyState}`}>
            <HiOutlineChatBubbleLeftRight size={40} className="text-zinc-200" strokeWidth={1.25} />
            <p className="mt-4 text-sm font-medium text-zinc-700">Select a conversation</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500">
              New leads from your profile appear in the Leads tab.
            </p>
          </div>

          <div className="border-t border-zinc-100 p-4">
            <div className="mx-auto flex max-w-2xl items-end gap-2 opacity-50">
              <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400">
                Type a reply…
              </div>
              <button
                type="button"
                disabled
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#153551] text-white"
                aria-label="Send message"
              >
                <HiOutlinePaperAirplane size={18} />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-zinc-400">
              Direct messaging coming soon · ID: {businessId.slice(0, 8)}…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
