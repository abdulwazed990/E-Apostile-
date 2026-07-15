/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, BadgeCheck, FileDown, Image, Sparkles, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, ZoomIn, FileText, CheckCircle, MapPin, Calendar, Award, ArrowDownCircle, Download } from 'lucide-react';
import { Certificate } from '../types';
import { FALLBACK_CERTIFICATES } from '../fallbackData';
import { renderCertificateToCanvas, downloadCanvasAsPdf, downloadCanvasAsJpg } from '../utils/certificateRenderer';

interface PublicVerificationProps {
  initialId?: string;
  onClearInitialId?: () => void;
  onNavigate?: (view: 'verify' | 'admin-login' | 'admin-dashboard') => void;
}

export default function PublicVerification({ initialId, onClearInitialId, onNavigate }: PublicVerificationProps) {
  const [searchId, setSearchId] = useState(initialId || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'reader' | 'official'>('official');
  const [publicCerts, setPublicCerts] = useState<{id: string, applicantName: string}[]>([]);
  const [customDomain, setCustomDomain] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch registered certificate database profiles for quick simulation select
  useEffect(() => {
    fetch('/api/public/certificates')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.certificates) {
          setPublicCerts(data.certificates);
        } else {
          setPublicCerts(FALLBACK_CERTIFICATES.map(c => ({ id: c.id, applicantName: c.applicantName })));
        }
      })
      .catch((e) => {
        console.log('Public fetch failed, using fallback', e);
        setPublicCerts(FALLBACK_CERTIFICATES.map(c => ({ id: c.id, applicantName: c.applicantName })));
      });
  }, [certificate]);

  // Trigger verification check
  const handleVerify = async (idToSearch: string) => {
    const trimmedId = idToSearch.trim().toUpperCase();
    if (!trimmedId) return;

    setLoading(true);
    setErrorMsg('');
    setCertificate(null);
    setSearched(true);
    setSearchId(trimmedId);

    try {
      const response = await fetch(`/api/certificates/verify/${encodeURIComponent(trimmedId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCertificate(data.certificate);
          setCustomDomain(data.customDomain || '');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('API fetch failed, falling back to static database lookup');
    }

    // Static fallback lookup for static hosts (GitHub Pages / Vercel)
    const staticCert = FALLBACK_CERTIFICATES.find(c => c.id.toUpperCase() === trimmedId);
    if (staticCert) {
      setCertificate(staticCert);
      setCustomDomain('');
    } else {
      setErrorMsg('✗ Invalid Certificate: No matching record found in the federal database.');
    }
    setLoading(false);
  };

  const getBaseVerificationUrl = () => {
    if (customDomain && customDomain.trim() !== '') {
      let domain = customDomain.trim();
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      if (domain.endsWith('/')) {
        domain = domain.slice(0, -1);
      }
      return domain;
    }
    return window.location.origin;
  };

  const getHostnameOnly = (urlStr: string): string => {
    try {
      let cleaned = urlStr;
      if (cleaned.startsWith('http://')) cleaned = cleaned.substring(7);
      if (cleaned.startsWith('https://')) cleaned = cleaned.substring(8);
      cleaned = cleaned.split('/')[0];
      cleaned = cleaned.split(':')[0];
      return cleaned;
    } catch (e) {
      return urlStr;
    }
  };

  // Run initial search ONLY if ID is specifically passed in URL or QR scan
  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    } else {
      setCertificate(null);
      setSearched(false);
    }
  }, [initialId]);

  // Redraw the canvas in background for high-fidelity offline downloads
  useEffect(() => {
    if (certificate && canvasRef.current) {
      setCanvasLoading(true);
      
      const baseDomain = getBaseVerificationUrl();
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        `${baseDomain}/verify/${certificate.id}`
      )}`;

      const timer = setTimeout(async () => {
        try {
          if (canvasRef.current) {
            const hostOnly = getHostnameOnly(baseDomain);
            await renderCertificateToCanvas(canvasRef.current, certificate, qrDataUrl, hostOnly);
          }
        } catch (e) {
          console.error("Canvas drawing failed", e);
        } finally {
          setCanvasLoading(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [certificate, customDomain]);

  const handleDownloadPdf = () => {
    if (!canvasRef.current || !certificate) return;
    downloadCanvasAsPdf(canvasRef.current, `MoFA_e-Apostille_${certificate.id}.pdf`);
  };

  const handleDownloadJpg = () => {
    if (!canvasRef.current || !certificate) return;
    downloadCanvasAsJpg(canvasRef.current, `MoFA_e-Apostille_${certificate.id}.jpg`);
  };

  return (
    <div className={`mx-auto bg-white min-h-screen animate-fade-in font-sans selection:bg-[#006a4e] selection:text-white pb-14 text-slate-800 pt-0 ${searched && certificate ? 'max-w-3xl' : 'max-w-xl'}`}>
           {/* Mobile-Converted Large Left-Aligned Logo with perfect masking/cropping to remove top/bottom white margins */}
      <div className="w-full bg-white border-b border-gray-100 h-[120px] sm:h-[150px] overflow-hidden flex items-center justify-start select-none px-0 pt-0">
        <div className="relative w-[340px] sm:w-[425px] h-[250px] sm:h-[310px] -mt-[10px] sm:-mt-[15px] ml-[-5px] sm:ml-[-8px]">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv&s=10"
            alt="myGov Apostille Logo"
            className="w-full h-full object-contain select-none block"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="px-5 sm:px-6 -mt-2 sm:-mt-3 pb-6 relative z-10">
        
        {/* WELCOME PORTAL HOME SCREEN: Renders only if no QR code scan / URL target is loaded */}
        {!searched && (
          <div className="space-y-6 text-center py-10 sm:py-16 animate-fade-in flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#006a4e] mb-4 shadow-sm">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2.5 max-w-md">
              <h1 className="text-[19px] sm:text-[23px] font-black text-[#0f2c59] tracking-tight leading-snug">
                অ্যাপোস্টিল ডিজিটাল পোর্টালে স্বাগতম
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#006a4e] font-black uppercase tracking-widest leading-relaxed">
                E-APOSTILLE VERIFICATION SYSTEM, MINISTRY OF FOREIGN AFFAIRS
              </p>
              <div className="w-12 h-0.5 bg-[#006a4e]/20 mx-auto my-3"></div>
              <p className="text-xs text-gray-400 font-bold leading-normal">
                দয়া করে আপনার সনده মুদ্রিত কিউআর (QR) কোডটি স্ক্যান করে ভেরিফাই করুন।
              </p>
              <p className="text-[10px] text-gray-400 italic">
                Please scan the QR code printed on your document to verify its authenticity.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* REAL-TIME SPINNER MODAL ON SEARCH (MATCHING VIDEO TEXT) */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-[#0c1524e1] backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in p-4">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col items-center justify-center shadow-2xl max-w-xs text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#006a4e] animate-spin"></div>
              <CheckCircle2 className="w-6 h-6 text-[#006a4e] absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#0f2c59] tracking-tight">যাচাই করা হচ্ছে...</h4>
              <p className="text-xs text-gray-500 font-bold leading-normal mt-1">আপনার তথ্য নিরাপদে যাচাই করা হচ্ছে</p>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED RESULTS CONTAINER */}
      {searched && !loading && (
        <div className="px-4 sm:px-5 space-y-10 max-w-4xl mx-auto">
          
          {/* INVALID STATE */}
          {!certificate && errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm max-w-2xl mx-auto animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-red-800 uppercase tracking-tight">✗ Invalid ID Provided</h3>
                <p className="text-xs text-red-600 font-bold mt-1 leading-normal">{errorMsg}</p>
                <p className="text-[11px] text-gray-400 mt-2">If this is an official file, please contact the Consular Section of MoFA, Dhaka.</p>
              </div>
            </div>
          )}

          {/* VERIFIED HIGH-FIDELITY HTML/CSS LAYOUT */}
          {certificate && (
            <div className="space-y-6 animate-fade-in">
              
              {/* A4 Apostille Main Board Preview (Always visible at the top as requested) */}
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 font-bold text-center animate-pulse flex items-center justify-center gap-1.5 sm:hidden">
                  ⟷ ডানে-বামে স্ক্রোল করুন (Scroll left/right to view full format)
                </p>
                
                {/* Physical Document sheet Mock Container */}
                <div id="full-stamp-page-view" className="bg-[#f0f2f5] p-1.5 sm:p-6 rounded-2xl border border-gray-200/60 shadow-inner flex justify-start sm:justify-center w-full max-w-full overflow-x-auto">
                  
                  {/* Real physical document certificate card */}
                  <div className="min-w-[580px] sm:min-w-0 w-full max-w-[620px] bg-white border-2 sm:border-[5px] border-[#006a4e] p-0.5 sm:p-1 shadow-xl relative overflow-hidden flex-shrink-0 mx-auto">
                
                {/* Decorative internal golden border */}
                <div className="border border-[#e2ba43] px-2.5 py-4 pb-3 sm:px-6 sm:py-8 bg-[#fffdfa] relative flex flex-col justify-between min-h-[580px] sm:min-h-[750px]">
                  
                  {/* Seamless Watermark Pattern */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                    <img 
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoO5Xk7jKpjqR_aQIlfTrPrSndqDAe7oqq9vQX4Q2SrQ&s=10"
                      alt="Watermark BG"
                      className="w-[75%] h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                    {/* Header Zone */}
                    <div className="text-center relative z-10">
                      {/* Circular Government Crest */}
                      <div className="flex justify-center mb-1.5 sm:mb-2">
                        <img 
                          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv&s=10" 
                          alt="Government of Bangladesh Crest" 
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h4 className="text-[10px] sm:text-[12px] font-black tracking-wider text-[#006a4e] leading-snug sm:leading-none uppercase px-1">
                        GOVERNMENT OF THE PEOPLE&apos;S REPUBLIC OF BANGLADESH
                      </h4>
                      <h5 className="text-[9px] sm:text-[11px] font-bold text-gray-750 mt-0.5 sm:mt-1 uppercase">
                        Ministry of Foreign Affairs, Dhaka
                      </h5>
                      <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold leading-normal mt-0.5">
                        পররাষ্ট্র মন্ত্রণালয়, ঢাকা, বাংলাদেশ
                      </p>

                      <div className="w-1/3 sm:w-1/2 h-[1px] bg-amber-500/30 mx-auto my-2.5 sm:my-3"></div>
                      
                      <h1 className="text-lg sm:text-2xl font-black tracking-widest text-[#0f2c59] border-b-2 border-[#e2ba43] inline-block pb-0.5">
                        APOSTILLE
                      </h1>
                      <p className="text-[8px] sm:text-[9.5px] font-bold text-gray-400 italic leading-snug mt-0.5 sm:mt-1">
                        (Convention de La Haye du 5 october 1961)
                      </p>
                    </div>

                    {/* Form Metadata Fields 1-10 (Exactly styled like legal sheet) */}
                    <div className="mt-4 sm:mt-6 text-[10px] sm:text-[11.5px] text-gray-855 space-y-2 sm:space-y-3 relative z-10 font-kalpurush">
                      
                      <div className="flex flex-row items-center justify-between sm:justify-start">
                        <span className="w-28 sm:w-44 font-bold text-gray-500 flex-shrink-0 text-[10px] sm:text-xs">1. Country (দেশ):</span>
                        <span className="font-kalpurush font-black text-[#006a4e] uppercase text-[11px] sm:text-[12.5px] tracking-wider font-extrabold">BANGLADESH</span>
                      </div>

                      <div className="py-1 border-y border-amber-500/10 italic text-[9px] sm:text-[10px] font-bold text-amber-850 bg-amber-50/20 px-2 rounded leading-none">
                        This public document / এই অফিসিয়াল বা পাবলিক ডকুমেন্টটি-
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-1">
                        <div className="flex flex-row items-center w-full sm:w-44 flex-shrink-0">
                          <span className="font-bold text-gray-500 text-[10px] sm:text-xs">2. Has been signed by:</span>
                        </div>
                        <span className="font-kalpurush font-black text-gray-950 text-[11.5px] sm:text-[13px] sm:pl-0 mt-0.5 sm:mt-0 font-extrabold">{certificate.officerName || 'CONTROLLER OF THE EXAMINATION'}</span>
                      </div>
                      <div className="flex items-center pl-0 sm:pl-[180px] text-[8.5px] text-gray-400 -mt-1 font-bold">
                        <span>(স্বাক্ষরকারী ব্যক্তির নাম)</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-1">
                        <div className="flex flex-row items-center w-full sm:w-44 flex-shrink-0">
                          <span className="font-bold text-gray-500 text-[10px] sm:text-xs">3. Acting in the capacity of:</span>
                        </div>
                        <span className="font-kalpurush font-black text-gray-900 text-[11px] sm:text-[12.5px] mt-0.5 sm:mt-0 font-extrabold">{certificate.officerDesignation || 'Controller of the examination'}</span>
                      </div>
                      <div className="flex items-center pl-0 sm:pl-[180px] text-[8.5px] text-gray-400 -mt-1 font-bold">
                        <span>(কর্মকর্তার পদবি)</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-1">
                        <div className="flex flex-row items-center w-full sm:w-44 flex-shrink-0">
                          <span className="font-bold text-gray-500 text-[10px] sm:text-xs">4. Bears the seal/stamp of:</span>
                        </div>
                        <span className="font-kalpurush font-black text-gray-900 text-[11px] sm:text-[12.5px] mt-0.5 sm:mt-0 font-extrabold">
                          {certificate.boardName || 'Higher & Secondary Education Board'}
                        </span>
                      </div>
                      <div className="flex items-center pl-0 sm:pl-[180px] text-[8.5px] text-gray-400 -mt-1 font-bold">
                        <span>(কার সীলমোহর বহন করে)</span>
                      </div>

                      <div className="py-1 border-y border-amber-500/10 italic text-[9px] sm:text-[10px] font-bold text-amber-850 bg-amber-50/20 px-2 rounded leading-none font-bold">
                        Certified / এতদ্বারা সত্যায়ন করা হলো-
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-500 text-[10px] sm:text-xs">5. At (স্থান):</span>
                          <span className="font-kalpurush font-black text-gray-955 text-[11px] sm:text-[12.5px] uppercase font-extrabold">DHAKA</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                          <span className="font-bold text-gray-550 text-[10px] sm:text-xs">6. Date (তারিখ):</span>
                          <span className="font-kalpurush font-black text-gray-900 text-[11px] sm:text-[12.5px] font-mono font-extrabold">{certificate.issueDate}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-1">
                        <div className="flex flex-row items-center w-full sm:w-44 flex-shrink-0">
                          <span className="font-bold text-gray-500 text-[10px] sm:text-xs">7. By (কর্তৃপক্ষ):</span>
                        </div>
                        <span className="font-kalpurush font-black text-[#0f2c59] text-[11px] sm:text-[12.5px] mt-0.5 sm:mt-0 uppercase font-extrabold">
                          MD. RASHID ABID, Assistant Secretary, Ministry of Foreign Affairs
                        </span>
                      </div>

                      <div className="flex flex-row items-center justify-between sm:justify-start">
                        <span className="w-28 sm:w-44 font-bold text-gray-500 flex-shrink-0 text-[10px] sm:text-xs">8. No (আইডি নম্বর):</span>
                        <span className="font-kalpurush font-black text-[#006a4e] text-[12px] sm:text-[14px] font-mono tracking-wide font-extrabold">{certificate.id}</span>
                      </div>

                    </div>

                     {/* Round Seal & Signature side-by-side box */}
                     <div className="grid grid-cols-2 gap-2 sm:gap-4 border border-amber-500/20 bg-amber-50/15 p-2 sm:p-3 rounded-xl mt-4 sm:mt-6 relative z-10 animate-fade-in font-kalpurush">
                       
                       {/* Left: Ministry Seal Stamp */}
                       <div className="flex flex-col items-center justify-between text-center border-r border-amber-500/10 pr-1.5 sm:pr-2">
                         {certificate.sealImageUrl && !certificate.sealImageUrl.includes('svg') && !certificate.sealImageUrl.includes('q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv') ? (
                           <div className="w-14 h-14 sm:w-20 sm:h-20 my-1 sm:my-2 flex items-center justify-center">
                             <img 
                               src={certificate.sealImageUrl} 
                               alt="Official MoFA Seal" 
                               className="w-full h-full object-contain filter drop-shadow-sm opacity-95"
                               referrerPolicy="no-referrer"
                             />
                           </div>
                         ) : (
                           <div className="w-14 h-14 sm:w-20 sm:h-20 my-1 sm:my-2 bg-transparent flex items-center justify-center">
                             {/* Left blank empty as requested */}
                           </div>
                         )}

                         <span className="text-[7.5px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider">
                           9. Seal / Stamp (সীলমোহর)
                         </span>
                         
                         <span className="text-[7.5px] sm:text-[8px] text-gray-450 italic leading-none block font-kalpurush font-bold">Ministry of Foreign Affairs, Dhaka</span>
                       </div>
 
                       {/* Right: Signature stamp */}
                       <div className="flex flex-col items-center justify-between text-center pl-1.5 sm:pl-2">
                         {certificate.signatureImageUrl && !certificate.signatureImageUrl.includes('svg') && !certificate.signatureImageUrl.includes('default') && certificate.signatureImageUrl.length >= 50 ? (
                           <div className="w-18 h-8 sm:w-24 sm:h-12 my-1 sm:my-2 flex items-center justify-center">
                             <img 
                               src={certificate.signatureImageUrl} 
                               alt="Officer Signature" 
                               className="w-full h-full object-contain filter opacity-95"
                               referrerPolicy="no-referrer"
                             />
                           </div>
                         ) : (
                           <div className="w-18 h-8 sm:w-24 sm:h-12 my-1 sm:my-2 bg-transparent flex items-center justify-center">
                             {/* Left blank empty as requested */}
                           </div>
                         )}

                         <span className="text-[7.5px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider">
                           10. Signature (স্বাক্ষর)
                         </span>
 
                         <div className="leading-tight font-kalpurush">
                           <span className="text-[8.5px] sm:text-[10px] font-kalpurush font-black text-gray-900 uppercase block leading-none font-extrabold">{certificate.officerName}</span>
                           <span className="text-[7px] sm:text-[8px] font-kalpurush font-bold text-gray-500 leading-tight block mt-0.5 font-extrabold">{certificate.officerDesignation}</span>
                         </div>
                       </div>
 
                     </div>

                    {/* Bottom scanning footnote */}
                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-4 sm:mt-6 flex flex-row items-center justify-between gap-3 relative z-10 text-[8px] sm:text-[9.5px]">
                      <div className="text-gray-400 leading-relaxed text-left max-w-[70%] sm:max-w-sm">
                        <p className="font-bold text-[#006a4e] text-[8.5px] sm:text-[10px]">Verification Directory Web Portal</p>
                        <p className="mt-0.5 leading-tight">To verify online, scan next-door QR or visit <strong className="text-gray-650 font-semibold select-all">https://{getHostnameOnly(getBaseVerificationUrl())}</strong> with unique ID.</p>
                      </div>

                      {/* Dynamic Verification Server Generated QR */}
                      <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white border border-gray-200 p-0.5 sm:p-1 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${getBaseVerificationUrl()}/verify/${certificate.id}`)}`}
                          alt="Verification QR code"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Single bottom download button as requested by user */}
                <div className="no-print pt-6 pb-2 text-center max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full bg-[#006a4e] hover:bg-[#005c43] text-white font-extrabold text-xs sm:text-base py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-[#005c43]"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    অ্যপোস্টিল ডাউনলোড করুন
                  </button>
                </div>

              </div>
            </div>

              {/* SYSTEM PERSISTED ENCLOSURE DOCUMENTS (ke ke sottyaito korse) LAYOUT */}
              {certificate.attachedCertificates && certificate.attachedCertificates.length > 0 && (
                <div className="space-y-6 mt-8 max-w-xl mx-auto">
                  
                  <div className="text-center border-b border-gray-200 pb-2.5 mt-4">
                    <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-tight">
                      সংযুক্ত মূল সনদপত্র এবং সত্যায়ন তথ্য
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                      Attestation Chain Summary and Official Records
                    </p>
                  </div>

                  <div className="space-y-8">
                    {certificate.attachedCertificates.map((certItem, index) => (
                      <div key={certItem.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6 text-slate-800">
                        
                        {/* Title bar of document */}
                        <div className="flex border-b pb-2 mb-2 items-center justify-between">
                          <span className="text-[9.5px] font-black text-[#006a4e] uppercase bg-[#006a4e]/10 px-2.5 py-1 rounded-full">
                            ATTACHMENT RECORD #{index + 1}
                          </span>
                          <span className="text-[9.5px] font-semibold text-gray-400 font-mono select-all">ID: {certItem.id}</span>
                        </div>

                        <div className="space-y-6">
                          
                          {/* Centered Attached Original Copy */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 self-start">Original Scanned Copy:</span>
                            
                            <div 
                              onClick={() => { if (certItem.certificateImageUrl) setLightboxImage(certItem.certificateImageUrl); }}
                              className="relative border border-gray-150 rounded-xl overflow-hidden bg-gray-50 h-64 sm:h-80 w-full max-w-md flex items-center justify-center group cursor-zoom-in shadow-inner"
                            >
                              <img 
                                src={certItem.certificateImageUrl} 
                                alt={`Certificate scan ${index + 1}`}
                                className="max-h-full max-w-full object-contain filter transition-all group-hover:brightness-95"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all bg-opacity-10">
                                <span className="opacity-0 group-hover:opacity-100 bg-black/90 text-white rounded-lg text-[9px] font-black px-3 py-1.5 uppercase tracking-wide flex items-center gap-1 shadow-md">
                                  <ZoomIn className="w-3.5 h-3.5" /> Enlarge Document copy
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Attester physical signatures stacked sequentially */}
                          {certItem.attestations && certItem.attestations.length > 0 && (
                            <div className="space-y-5 pt-4 border-t border-gray-155">
                              <h4 className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-wider text-center">
                                সত্যায়ন কর্মকর্তা এবং স্বাক্ষর বিবরণী (Attestation Log)
                              </h4>

                              <div className="space-y-6 flex flex-col items-center">
                                {certItem.attestations.map((attAction) => (
                                  <div 
                                    key={attAction.id} 
                                    className="w-full max-w-md flex flex-col items-center text-center p-4 bg-purple-50/15 border border-purple-500/10 rounded-2xl relative select-none shadow-sm"
                                  >
                                    {/* Cursive style Purple/Blue ink state */}
                                    <div className="font-cursive font-bold italic text-purple-800 text-[18px] tracking-wide border-b border-dashed border-purple-300 pb-1 uppercase w-full">
                                      &quot;{attAction.type || 'Verified and found correct'}&quot;
                                    </div>

                                    {/* Simulated ink signature photo in center */}
                                    {attAction.signatureImageUrl ? (
                                      <div className="h-12 my-2.5 flex items-center justify-center max-w-[150px] drop-shadow-sm">
                                        <img 
                                          src={attAction.signatureImageUrl} 
                                          alt="Attestation Ink Signature" 
                                          className="h-full object-contain filter hue-rotate-15 saturate-200"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-8 my-2 flex items-center justify-center opacity-30 italic text-[9px] text-gray-400">
                                        (Digitally Signed)
                                      </div>
                                    )}

                                    {/* Officer Parameters */}
                                    <div className="space-y-0.5 leading-tight">
                                      <p className="text-[10.5px] font-black text-gray-900 uppercase tracking-tight">{attAction.officerName}</p>
                                      <p className="text-[9.5px] font-bold text-gray-500 leading-tight px-2 max-w-xs">{attAction.officerDesignation}</p>
                                      <p className="text-[8.5px] font-semibold text-purple-600 font-mono tracking-wider mt-1.5 bg-purple-100/50 px-2.5 py-0.5 rounded-full inline-block">
                                        Date: {attAction.date}
                                      </p>
                                    </div>

                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* HIDDEN BACKGROUND CANVAS NODE FOR SYSTEM PREPARATION */}
              <canvas 
                ref={canvasRef} 
                className="hidden pointer-events-none absolute opacity-0"
              />

            </div>
          )}

          {/* LIGHTBOX POPUP */}
          {lightboxImage && (
            <div 
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
            >
              <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
                <button 
                  onClick={() => setLightboxImage(null)}
                  className="absolute -top-12 right-0 bg-[#006a4e] text-white px-4 py-2 font-black uppercase text-xs rounded-xl cursor-pointer hover:bg-[#004e39] transition-colors"
                  title="Close Preview"
                >
                  ✕ Close Preview
                </button>
                <img 
                  src={lightboxImage} 
                  alt="Full Enlarge View" 
                  className="max-w-full max-h-[80vh] object-contain rounded-xl border border-gray-800 shadow-2xl bg-white"
                  referrerPolicy="no-referrer"
                />
                <p className="text-gray-400 text-xs mt-3 leading-loose select-none font-bold text-center">
                  Verified e-Apostille Document Node. Tap anywhere of background to dismiss.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
