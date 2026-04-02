import { Check } from 'lucide-react';

interface PricingCardProps {
  plan: string;
  price: string;
  oldPrice?: string;
  features: string[];
  recommended?: boolean;
  buttonText: string;
  period?: string;
  onClick?: () => void;
}

export default function PricingCard({ plan, price, oldPrice, features, recommended, buttonText, period = 'month', onClick }: PricingCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 ${recommended ? 'border-blue-600 shadow-xl shadow-blue-50 scale-105 z-10' : 'border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
      {recommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-lg shadow-blue-100 uppercase tracking-wider">
          Recommended
        </div>
      )}
      <div className="mb-6 text-center">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{plan}</h3>
        {oldPrice && (
          <div className="text-slate-300 line-through font-bold text-[10px] mb-0.5">{oldPrice}</div>
        )}
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{price}</span>
          <span className="text-slate-400 font-bold text-[10px]">/{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-slate-600 group">
            <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${recommended ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              <Check size={12} strokeWidth={4} />
            </div>
            <span className="text-[11px] font-medium tracking-tight group-hover:text-slate-900 transition-colors">{feature}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={onClick}
        className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-[10px] uppercase tracking-widest active:scale-95 ${recommended ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
      >
        {buttonText}
      </button>
    </div>
  );
}
