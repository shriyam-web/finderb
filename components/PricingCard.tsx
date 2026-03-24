import { Check } from 'lucide-react';

interface PricingCardProps {
  plan: string;
  price: string;
  features: string[];
  recommended?: boolean;
  buttonText: string;
}

export default function PricingCard({ plan, price, features, recommended, buttonText }: PricingCardProps) {
  return (
    <div className={`relative bg-white rounded-3xl p-8 shadow-sm border ${recommended ? 'border-blue-500 shadow-xl scale-105 z-10' : 'border-gray-100 hover:shadow-lg transition-all'}`}>
      {recommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full">
          RECOMMENDED
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-gray-900">{price}</span>
          <span className="text-gray-500 font-medium">/month</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-gray-600">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${recommended ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-sm font-medium">{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-xl font-bold transition-all ${recommended ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>
        {buttonText}
      </button>
    </div>
  );
}
