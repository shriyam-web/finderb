'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Upload, 
  Trophy,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { updateBusinessKYC, getBusiness } from '@/app/actions/business';

export default function KYCPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [kycData, setKycData] = useState({
    panNumber: '',
    aadharNumber: '',
    panUrl: '',
    aadharUrl: '',
    msmeGstUrl: ''
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      const res = await getBusiness(id);
      if (res.success) {
        setBusiness(res.business);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKycData(prev => ({ ...prev, [name]: value }));
  };

  const handleKycSubmission = async () => {
    if (!kycData.panNumber || !kycData.aadharNumber || !kycData.panUrl || !kycData.aadharUrl) {
      alert('PAN and Aadhar details with uploads are compulsory');
      return;
    }
    setLoading(true);
    try {
      const result = await updateBusinessKYC(id, kycData);
      if (result.success) {
        alert('KYC Documents Submitted Successfully!');
        router.push(`/business/dashboard?id=${id}`);
      } else {
        alert(result.error || 'KYC submission failed');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold italic">B</div>
              <span className="text-lg font-extrabold tracking-tighter italic">BOOMB</span>
            </Link>

            <div className="space-y-6">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={16} className="text-blue-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">KYC Verification</span>
                </div>
                <p className="text-[10px] text-blue-100 leading-relaxed font-medium">Verify your identity to build trust with customers.</p>
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

        {/* Right Form Panel */}
        <div className="flex-grow p-8 md:p-16 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-blue-600 animate-pulse uppercase tracking-[0.2em] text-[10px]">Uploading Documents...</p>
            </div>
          )}

          <div className="max-w-xl mx-auto space-y-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-1 border border-blue-100">
                <ShieldCheck size={12} /> Compliance
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">Identity <br /><span className="text-blue-600 font-black italic">Verification</span></h2>
              <p className="text-gray-400 font-medium text-sm">Mandatory government ID verification for listing</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">PAN Number*</label>
                  <input 
                    name="panNumber"
                    value={kycData.panNumber}
                    onChange={handleKycChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all uppercase placeholder:text-gray-300 text-sm" 
                    placeholder="ABCDE1234F" 
                  />
                </div>
                <div className="group space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">Aadhar Number*</label>
                  <input 
                    name="aadharNumber"
                    value={kycData.aadharNumber}
                    onChange={handleKycChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm" 
                    placeholder="1234 5678 9012" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">Upload ID (URL)*</label>
                  <div className="relative group/upload">
                    <input 
                      name="panUrl"
                      value={kycData.panUrl}
                      onChange={handleKycChange}
                      className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl focus:border-blue-600 outline-none font-semibold text-gray-600 transition-all text-[11px]"
                      placeholder="File URL / Path"
                    />
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover/upload:text-blue-600" size={16} />
                  </div>
                </div>
                <div className="group space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">Address Proof (URL)*</label>
                  <div className="relative group/upload">
                    <input 
                      name="aadharUrl"
                      value={kycData.aadharUrl}
                      onChange={handleKycChange}
                      className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl focus:border-blue-600 outline-none font-semibold text-gray-600 transition-all text-[11px]"
                      placeholder="File URL / Path"
                    />
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover/upload:text-blue-600" size={16} />
                  </div>
                </div>
              </div>

              <div className="group space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">MSME / GST (Optional)</label>
                <div className="relative group/upload">
                  <input 
                    name="msmeGstUrl"
                    value={kycData.msmeGstUrl}
                    onChange={handleKycChange}
                    className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl focus:border-blue-600 outline-none font-semibold text-gray-600 transition-all text-[11px]"
                    placeholder="File URL / Path"
                  />
                  <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover/upload:text-blue-600" size={16} />
                </div>
              </div>

              <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Trophy className="text-blue-600 shrink-0" size={18} />
                <div className="space-y-0.5">
                  <p className="text-blue-900 font-extrabold text-[11px] uppercase tracking-wider">Priority Access</p>
                  <p className="text-blue-700 text-[10px] font-medium leading-relaxed italic">Adding GST/MSME optionally here helps in getting the <strong>Verified Badge</strong> faster.</p>
                </div>
              </div>

              <button 
                onClick={handleKycSubmission}
                className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 group mt-8"
              >
                Submit Documents
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
