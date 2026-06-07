'use client';

import { useState } from 'react';
import { 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineEnvelope
} from 'react-icons/hi2';

interface MessagesTabProps {
  businessId: string;
}

export default function MessagesTab({ businessId }: MessagesTabProps) {
  const [activeView, setActiveView] = useState<'messages' | 'customers'>('messages');

  return (
    <div className="h-[calc(100vh-14rem)] min-h-[600px] flex flex-col space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm group">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl group-hover:bg-indigo-100/40 transition-colors duration-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-indigo-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Connect with Audience</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Communication Hub</h1>
              <p className="text-slate-500 font-medium mt-1">Engage with potential customers and manage your network.</p>
            </div>
          </div>

          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md">
            <button 
              onClick={() => setActiveView('messages')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeView === 'messages' 
                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HiOutlineEnvelope size={18} />
              Messages
            </button>
            <button 
              onClick={() => setActiveView('customers')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeView === 'customers' 
                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HiOutlineUsers size={18} />
              Customers
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/20">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${activeView}...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {/* Empty State Sidebar */}
            <div className="py-20 flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform duration-500">
                {activeView === 'messages' ? <HiOutlineChatBubbleLeftRight size={32} /> : <HiOutlineUsers size={32} />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.2em]">Silence is golden</p>
                <p className="text-sm font-bold text-slate-400">No {activeView} found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative w-32 h-32 bg-indigo-50 rounded-[2.5rem] border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300">
                {activeView === 'messages' ? <HiOutlineChatBubbleLeftRight size={56} strokeWidth={1.2} /> : <HiOutlineUsers size={56} strokeWidth={1.2} />}
              </div>
            </div>
            
            <div className="max-w-md space-y-3">
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {activeView === 'messages' ? 'Your Inbox Awaits' : 'Customer Directory'}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                {activeView === 'messages' 
                  ? 'Messages sent to you will be displayed here. When a customer reaches out, you\'ll see their direct messages here.' 
                  : 'Maintain a direct line of communication with your customers. All your DMs and contacts will be organized here.'}
              </p>
            </div>

            {activeView === 'messages' ? (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-50/50 text-indigo-600 rounded-2xl border border-indigo-100/50 text-xs font-bold">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Listening for incoming inquiries
              </div>
            ) : (
              <button className="px-8 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">
                Export Customer List
              </button>
            )}
          </div>

          {/* Dummy Input for visual completeness */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/30">
            <div className="relative group max-w-3xl mx-auto w-full opacity-60 grayscale cursor-not-allowed">
              <div className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-6 py-5 text-sm font-semibold text-slate-400 shadow-sm">
                Select a thread to continue the conversation...
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="p-2.5 bg-slate-100 text-slate-300 rounded-xl">
                  <HiOutlinePaperAirplane size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
