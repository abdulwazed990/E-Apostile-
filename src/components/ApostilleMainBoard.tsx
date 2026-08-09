/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Certificate } from '../types';

interface ApostilleMainBoardProps {
  certificate: Certificate;
  baseDomain: string;
  readOnly?: boolean;
}

export default function ApostilleMainBoard({ certificate, baseDomain, readOnly = false }: ApostilleMainBoardProps) {
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

  const currentBase = baseDomain || (typeof window !== 'undefined' ? window.location.origin : '');
  const hostOnly = getHostnameOnly(currentBase);
  const verifyUrl = `${currentBase}/verify/${certificate.id}`;
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`;

  const hasSeal = Boolean(
    certificate.sealImageUrl &&
    certificate.sealImageUrl.trim() !== ''
  );

  const hasSignature = Boolean(
    certificate.signatureImageUrl &&
    certificate.signatureImageUrl.trim() !== ''
  );

  return (
    <div id="full-stamp-page-view" className="bg-[#f8fafc] p-1 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm flex justify-center w-full max-w-full overflow-hidden">
      
      {/* Real physical document certificate card with locked A4 Aspect Ratio (210:297) */}
      <div className="w-full max-w-[620px] aspect-[210/297] bg-white border-[0.6cqw] border-[#006a4e] p-[0.8cqw] shadow-xl relative overflow-hidden mx-auto font-sans flex flex-col justify-between [container-type:inline-size] select-none">
        
        {/* Decorative internal golden border */}
        <div className="border-[0.18cqw] border-[#e2ba43] px-[3.2cqw] py-[3.2cqw] bg-white relative flex flex-col justify-between h-full w-full">
          
          {/* Seamless Watermark Pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoO5Xk7jKpjqR_aQIlfTrPrSndqDAe7oqq9vQX4Q2SrQ&s=10"
              alt="Watermark BG"
              className="w-[70%] h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Header Zone */}
          <div className="text-center relative z-10">
            {/* Circular Government Crest */}
            <div className="flex justify-center mb-[0.6cqw]">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" 
                alt="Government of Bangladesh Crest" 
                className="w-[9cqw] h-[9cqw] object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="text-[1.8cqw] font-black tracking-wider text-[#006a4e] leading-snug uppercase px-[1cqw]">
              GOVERNMENT OF THE PEOPLE&apos;S REPUBLIC OF BANGLADESH
            </h4>
            <h5 className="text-[1.5cqw] font-bold text-gray-800 mt-[0.2cqw] uppercase">
              Ministry of Foreign Affairs, Dhaka
            </h5>
            <p className="text-[1.3cqw] text-gray-500 font-bold leading-normal mt-[0.1cqw]">
              পররাষ্ট্র মন্ত্রণালয়, ঢাকা, বাংলাদেশ
            </p>

            <div className="w-[45%] h-[0.12cqw] bg-amber-500/30 mx-auto my-[1.2cqw]"></div>
            
            <h1 className="text-[3.2cqw] font-black tracking-widest text-[#0f2c59] border-b-[0.2cqw] border-[#e2ba43] inline-block pb-[0.2cqw]">
              APOSTILLE
            </h1>
            <p className="text-[1.3cqw] font-bold text-gray-500 italic leading-snug mt-[0.3cqw]">
              (Convention de La Haye du 5 october 1961)
            </p>
          </div>

          {/* Form Metadata Fields 1-8 */}
          <div className="mt-[1.5cqw] text-gray-800 space-y-[1.1cqw] relative z-10">
            
            <div className="flex flex-row items-center justify-between">
              <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">1. Country (দেশ):</span>
              <span className="font-black text-[#006a4e] uppercase text-[1.85cqw] tracking-wider font-extrabold">BANGLADESH</span>
            </div>

            <div className="py-[0.35cqw] px-[1cqw] border-y-[0.1cqw] border-amber-500/15 italic text-[1.45cqw] font-bold text-gray-700 bg-gray-50/50 rounded leading-none">
              This public document / এই অফিসিয়াল বা পাবলিক ডকুমেন্টটি-
            </div>

            <div className="flex flex-col">
              <div className="flex flex-row items-center">
                <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">2. Has been signed by:</span>
                <span className="font-black text-gray-950 text-[1.8cqw] font-extrabold">{certificate.officerName || 'CONTROLLER OF THE EXAMINATION'}</span>
              </div>
              <div className="pl-[32cqw] text-[1.2cqw] text-gray-400 font-bold -mt-[0.2cqw]">
                <span>(স্বাক্ষরকারী ব্যক্তির নাম)</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-row items-center">
                <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">3. Acting in the capacity of:</span>
                <span className="font-black text-gray-900 text-[1.7cqw] font-extrabold">{certificate.officerDesignation || 'Controller of the examination'}</span>
              </div>
              <div className="pl-[32cqw] text-[1.2cqw] text-gray-400 font-bold -mt-[0.2cqw]">
                <span>(কর্মকর্তার পদবি)</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-row items-center">
                <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">4. Bears the seal/stamp of:</span>
                <span className="font-black text-gray-900 text-[1.7cqw] font-extrabold">
                  {certificate.boardName || 'Higher & Secondary Education Board'}
                </span>
              </div>
              <div className="pl-[32cqw] text-[1.2cqw] text-gray-400 font-bold -mt-[0.2cqw]">
                <span>(কার সীলমোহর বহন করে)</span>
              </div>
            </div>

            <div className="py-[0.35cqw] px-[1cqw] border-y-[0.1cqw] border-amber-500/15 italic text-[1.45cqw] font-bold text-gray-700 bg-gray-50/50 rounded leading-none">
              Certified / এতদ্বারা সত্যায়ন করা হলো-
            </div>

            <div className="grid grid-cols-2 gap-[1cqw]">
              <div className="flex items-center gap-[0.8cqw]">
                <span className="font-bold text-gray-600 text-[1.65cqw]">5. At (স্থান):</span>
                <span className="font-black text-gray-900 text-[1.8cqw] uppercase font-extrabold">DHAKA</span>
              </div>
              <div className="flex items-center gap-[0.8cqw]">
                <span className="font-bold text-gray-600 text-[1.65cqw]">6. Date (তারিখ):</span>
                <span className="font-black text-[#006a4e] text-[1.85cqw] font-mono font-extrabold">{certificate.issueDate}</span>
              </div>
            </div>

            <div className="flex flex-row items-center">
              <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">7. By (কর্তৃপক্ষ):</span>
              <span className="font-black text-[#0f2c59] text-[1.7cqw] uppercase font-extrabold">
                MD. RASHID ABID, Assistant Secretary, Ministry of Foreign Affairs
              </span>
            </div>

            <div className="flex flex-row items-center">
              <span className="w-[32cqw] font-bold text-gray-600 flex-shrink-0 text-[1.65cqw]">8. No (আইডি নম্বর):</span>
              <span className="font-black text-[#006a4e] text-[2.1cqw] font-mono tracking-wide font-extrabold">{certificate.id}</span>
            </div>

          </div>

          {/* Round Seal & Signature side-by-side box (Fields 9 & 10) */}
          <div className="grid grid-cols-2 gap-[2cqw] border-[0.15cqw] border-amber-500/20 bg-amber-50/10 p-[1.5cqw] rounded-[1cqw] mt-[1.8cqw] relative z-10 animate-fade-in">
            
            {/* Left: Item 9 Seal / Stamp */}
            <div className="flex flex-col items-center justify-between text-center border-r-[0.1cqw] border-amber-500/15 pr-[1.2cqw] min-h-[13.5cqw]">
              {hasSeal ? (
                <div className="w-[12cqw] h-[12cqw] my-[0.3cqw] flex items-center justify-center bg-transparent">
                  <img 
                    src={certificate.sealImageUrl} 
                    alt="Official MoFA Seal" 
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm opacity-95 mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-[12cqw] h-[12cqw] my-[0.3cqw] bg-transparent flex flex-col items-center justify-center border-[0.1cqw] border-dashed border-gray-300/60 rounded-full p-[0.5cqw] text-center">
                  <span className="text-[1.1cqw] text-gray-400 font-bold leading-tight">No seal uploaded</span>
                </div>
              )}

              <span className="text-[1.45cqw] font-black text-gray-600 uppercase tracking-wider mt-auto">
                9. Seal / Stamp (সীলমোহর)
              </span>
              
              <span className="text-[1.25cqw] text-gray-500 italic leading-none block font-bold">Ministry of Foreign Affairs, Dhaka</span>
            </div>

            {/* Right: Item 10 Signature */}
            <div className="flex flex-col items-center justify-between text-center pl-[1.2cqw] min-h-[13.5cqw]">
              {hasSignature ? (
                <div className="w-[18cqw] h-[9cqw] my-[0.3cqw] flex items-center justify-center bg-transparent">
                  <img 
                    src={certificate.signatureImageUrl} 
                    alt="Officer Signature" 
                    className="max-h-full max-w-full object-contain filter opacity-95 mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-[18cqw] h-[9cqw] my-[0.3cqw] bg-transparent flex flex-col items-center justify-center border-[0.1cqw] border-dashed border-gray-300/60 rounded p-[0.5cqw] text-center">
                  <span className="text-[1.1cqw] text-gray-400 font-bold leading-tight">No signature uploaded</span>
                </div>
              )}

              <span className="text-[1.45cqw] font-black text-gray-600 uppercase tracking-wider mt-auto">
                10. Signature (স্বাক্ষর)
              </span>

              <div className="leading-tight mt-[0.3cqw]">
                <span className="text-[1.6cqw] font-black text-[#006a4e] uppercase block leading-none font-extrabold">{certificate.officerName}</span>
                <span className="text-[1.25cqw] font-bold text-[#006a4e]/90 leading-tight block mt-[0.2cqw] font-extrabold">{certificate.officerDesignation}</span>
              </div>
            </div>

          </div>

          {/* Bottom scanning footnote & Unique Record QR Code */}
          <div className="border-t-[0.15cqw] border-gray-200 pt-[1.2cqw] mt-[1.8cqw] flex flex-row items-center justify-between gap-[1.5cqw] relative z-10">
            <div className="text-gray-500 leading-relaxed text-left max-w-[68%]">
              <p className="font-bold text-[#006a4e] text-[1.55cqw]">Verification Directory Web Portal</p>
              <p className="mt-[0.2cqw] leading-tight text-[1.35cqw]">To verify online, scan next-door QR or visit <strong className="text-gray-700 font-semibold select-all">https://{hostOnly}</strong> with unique ID.</p>
            </div>

            {/* Dynamic Verification Server Generated Unique High-Res QR */}
            <div className="w-[13.5cqw] h-[13.5cqw] bg-white border-[0.15cqw] border-gray-300 p-[0.6cqw] rounded-[0.8cqw] flex items-center justify-center shadow-sm flex-shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`}
                alt={`Unique QR Code for Apostille ${certificate.id}`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
