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
    <div className={`relative bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${recommended ? 'border-secondary/20 shadow-[0_20px_60px_-15px_rgba(0,186,242,0.15)] scale-105 z-10' : 'border-gray-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500'}`}>
      {recommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white text-[10px] font-medium px-6 py-2 rounded-full shadow-xl shadow-secondary/20">
          Most Popular
        </div>
      )}
      <div className="mb-10 text-center">
        <h3 className="text-sm font-medium text-primary mb-4">{plan}</h3>
        {oldPrice && (
          <div className="text-gray-400 line-through font-medium text-sm mb-1">{oldPrice}</div>
        )}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black text-primary tracking-tighter">{price}</span>
          <span className="text-gray-400 font-medium text-xs">/{period}</span>
        </div>
      </div>
      <ul className="space-y-5 mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-4 text-gray-500 group">
            <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${recommended ? 'bg-secondary/10 text-secondary' : 'bg-gray-50 text-gray-400'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-medium group-hover:text-primary transition-colors">{feature}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={onClick}
        className={`w-full py-5 rounded-2xl font-medium transition-all duration-500 text-[10px] active:scale-95 ${recommended ? 'bg-secondary text-white hover:bg-primary shadow-xl shadow-secondary/20 hover:shadow-primary/20' : 'bg-gray-50 text-primary hover:bg-gray-100'}`}
      >
        {buttonText}
      </button>
    </div>
  );
}
