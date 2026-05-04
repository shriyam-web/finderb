'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard,
  Rocket,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { updateBusinessPayment, getBusiness } from '@/app/actions/business';

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    const fetchBusiness = async () => {
      const res = await getBusiness(id);
      if (res.success && res.business) {
        setBusiness(res.business);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleRazorpayPayment = async () => {
    setLoading(true);
    // Simulate Razorpay popup and success
    setTimeout(async () => {
      try {
        const result = await updateBusinessPayment(id, {
          paymentId: `pay_${Math.random().toString(36).substring(2, 11)}`,
          orderId: `order_${Math.random().toString(36).substring(2, 11)}`,
          selectedPlan,
          billingCycle
        });
        if (result.success) {
          alert('Payment Successful! Welcome to FinderB Business.');
          router.push(`/business/dashboard?id=${id}`);
        } else {
          alert(result.error || 'Payment update failed');
        }
      } catch (error) {
        alert('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 pt-32 md:pt-48 pb-20">
      <div className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Info Panel */}
        <div className="w-full md:w-80 bg-blue-600 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10 space-y-12">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold italic">F</div>
              <span className="text-lg font-extrabold tracking-tighter italic">FINDERB</span>
            </Link>

            <div className="space-y-6">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard size={16} className="text-blue-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Premium Access</span>
                </div>
                <p className="text-[10px] text-blue-100 leading-relaxed font-medium">Unlock full growth potential with Pro listing.</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Business</p>
                <p className="font-black text-xl italic">{business.businessName}</p>
                <p className="text-xs text-blue-100/60 font-medium">ID: {business.registrationNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Portal
            </button>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-grow p-8 md:p-16 relative flex flex-col justify-center">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-blue-600 animate-pulse uppercase tracking-[0.2em] text-[10px]">Connecting to Gateway...</p>
            </div>
          )}

          <div className="max-w-xl mx-auto space-y-10 w-full">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">Growth <br /><span className="text-blue-600 font-black italic">Accelerator</span></h2>
              <p className="text-gray-400 font-medium text-sm">Power your business with premium features</p>
            </div>

            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1 border border-gray-200 w-fit mx-auto">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all relative ${billingCycle === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                Annual
                <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[7px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Save 20%</span>
              </button>
            </div>

            <div className="bg-blue-600 p-8 rounded-[32px] shadow-2xl shadow-blue-100 text-white space-y-8 group transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight">Growth Pro</h3>
                  <p className="text-blue-200 font-bold uppercase tracking-[0.2em] text-[9px]">Ultimate Business Suite</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black tracking-tighter italic">₹{billingCycle === 'monthly' ? '299' : '2,990'}</span>
                  <p className="text-blue-100 text-[9px] font-bold">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Top Ranking Results',
                  'Verified Badge UI',
                  'Call Lead Dashboard',
                  'Premium Analytics',
                  'Priority Support',
                  'Custom URL Access'
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-blue-300" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleRazorpayPayment}
                className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-extrabold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <CreditCard size={18} />
                Pay Securely
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-green-500" />
                PCIDSS COMPLIANT GATEWAY
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
