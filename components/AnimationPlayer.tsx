/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState } from 'react';

// Add declaration for the gifshot library loaded from CDN
declare var gifshot: any;

interface AnimationPlayerProps {
  gifUrl: string;
  onBack: () => void;
}

const AnimationPlayer: React.FC<AnimationPlayerProps> = ({ gifUrl, onBack }) => {
  const [isExporting, setIsExporting] = useState(false);

 const handleExport = () => {
    setIsExporting(true);
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = 'anh_dong.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Add a small delay to give the download time to start, especially on slower systems
    setTimeout(() => setIsExporting(false), 500);
 };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl">
      <div 
        className="relative w-full max-w-4xl max-h-[80vh] bg-white/60 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg mb-4 flex items-center justify-center border border-slate-200"
        >
        <img src={gifUrl} alt="Ảnh GIF đã tạo" className="max-w-full max-h-full object-contain" />
      </div>

    <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-4">
        <button onClick={onBack} className="bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-slate-400">Quay lại</button>
        <button onClick={handleExport} disabled={isExporting} className="bg-kv-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-kv-blue-dark transition-colors duration-200 flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-blue-500">
            {isExporting ? 'Đang tải xuống...' : 'Tải GIF'}
        </button>
    </div>
    </div>
  );
};

export default AnimationPlayer;