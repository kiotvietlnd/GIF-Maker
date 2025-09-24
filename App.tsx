/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef } from 'react';
import { AppState } from './types';
import AnimationPlayer from './components/AnimationPlayer';
import LoadingOverlay from './components/LoadingOverlay';
import { XCircleIcon, UploadIcon } from './components/icons';

// Add declaration for the gifshot library loaded from CDN
declare var gifshot: any;

const processImage = (dataUrl: string, maxDimension: number = 1920): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;

      // If it's small enough, just convert to PNG for consistency.
      if (width <= maxDimension && height <= maxDimension) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context.'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // If larger, resize while maintaining aspect ratio.
      let newWidth, newHeight;
      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round((height / width) * maxDimension);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((width / height) * maxDimension);
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context for resizing.'));
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for processing.'));
    img.src = dataUrl;
  });
};

const ControlSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    helpText: string;
}> = ({ label, value, min, max, step, onChange, helpText }) => (
    <div>
        <label htmlFor={label} className="block text-sm font-medium text-slate-600">
            {label}
        </label>
        <div className="flex items-center gap-3 mt-1">
            <input
                id={label}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-kv-blue"
            />
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={e => onChange(Number(e.target.value))}
                className="w-20 bg-slate-50 text-slate-800 border border-slate-300 rounded-md px-2 py-1 text-center"
            />
        </div>
        <p className="text-xs text-slate-500 mt-2">{helpText}</p>
    </div>
);

const SoftGlowBackground: React.FC = () => (
    <div className="soft-glow-background">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
    </div>
);

const Header: React.FC = () => (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <a href="#" className="flex items-center gap-3">
                    <img src="https://logo.kiotviet.vn/KiotViet-Logo-Horizontal.svg" alt="KiotViet Logo" className="h-8" />
                    <span className="text-xl font-bold text-slate-800 tracking-tight">GIF Maker</span>
                </a>
            </div>
        </div>
    </header>
);


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Capturing);
  const [images, setImages] = useState<{ id: string, dataUrl: string }[]>([]);
  const [generatedGif, setGeneratedGif] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gifSpeed, setGifSpeed] = useState<number>(120); // ms per frame
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setLoading(true);
    
    // FIX: Explicitly type `file` as `File` and update Promise generic to allow `null`.
    const imagePromises = Array.from(files).map((file: File) => {
        return new Promise<({ id: string, dataUrl: string }) | null>((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                // Silently ignore non-image files for a smoother UX
                return resolve(null);
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) {
                    try {
                        const processedImage = await processImage(dataUrl);
                        resolve({ id: crypto.randomUUID(), dataUrl: processedImage });
                    } catch (err) {
                        console.error("Image processing error:", err);
                        reject(err);
                    }
                }
            };
            reader.onerror = () => {
                reject(new Error("Không thể đọc tệp đã chọn."));
            };
            reader.readAsDataURL(file);
        });
    });

    try {
      const newImages = (await Promise.all(imagePromises)).filter(img => img !== null);
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xử lý một hoặc nhiều ảnh.');
    } finally {
      setLoading(false);
    }
    
    // Reset file input value to allow re-selection of the same file(s)
    event.target.value = '';
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }

  const handleCreateGif = useCallback(() => {
    if (images.length < 2) {
      setError("Vui lòng tải lên ít nhất 2 ảnh để tạo GIF.");
      return;
    }
    
    setAppState(AppState.Processing);
    setError(null);

    const imageUrls = images.map(img => img.dataUrl);
    const intervalInSeconds = gifSpeed / 1000;
    
    // Create an image to get dimensions from the first frame to ensure correct aspect ratio
    const firstImage = new Image();
    firstImage.onload = () => {
        gifshot.createGIF({
            images: imageUrls,
            interval: intervalInSeconds,
            numWorkers: 2,
            gifWidth: firstImage.width,
            gifHeight: firstImage.height,
        }, (obj: { error: boolean; image: string; errorMsg: string }) => {
            if (!obj.error) {
                setGeneratedGif(obj.image);
                setAppState(AppState.Animating);
            } else {
                console.error('GIF creation failed:', obj.errorMsg);
                setError(`Tạo GIF thất bại: ${obj.errorMsg}`);
                setAppState(AppState.Capturing);
            }
        });
    };
    firstImage.onerror = () => {
        setError('Không thể đọc kích thước ảnh để tạo GIF.');
        setAppState(AppState.Capturing);
    };
    firstImage.src = images[0].dataUrl;
  }, [images, gifSpeed]);
  
  const handleBack = () => {
    setAppState(AppState.Capturing);
    setGeneratedGif(null);
    // Optionally clear images on back
    // setImages([]);
  };
  
  const isCreateDisabled = images.length < 2 || loading;

  const renderContent = () => {
    switch (appState) {
      case AppState.Capturing:
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto h-full">
            <div className="w-full bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 shadow-lg flex-grow overflow-y-auto min-h-0 no-scrollbar">
                {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map(image => (
                            <div key={image.id} className="relative group aspect-square">
                                <img src={image.dataUrl} alt="Khung hình GIF" className="w-full h-full object-cover rounded-md" />
                                <button
                                    onClick={() => handleRemoveImage(image.id)}
                                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-red-500"
                                    aria-label="Xóa ảnh"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <ImageIcon className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">Các khung hình của bạn sẽ xuất hiện ở đây</h3>
                        <p>Tải lên 2 ảnh trở lên để bắt đầu.</p>
                    </div>
                )}
            </div>
            <div className="w-full mt-4 p-6 bg-white/60 backdrop-blur-lg rounded-2xl border border-slate-200 shadow-lg space-y-4">
                <ControlSlider 
                    label="Tốc độ ảnh động (ms/khung hình)" 
                    value={gifSpeed} 
                    min={50} 
                    max={2000} 
                    step={10} 
                    onChange={v => setGifSpeed(v)} 
                    helpText="Giá trị càng thấp thì tốc độ càng nhanh. 1000ms = 1 giây."
                />
            </div>
             <div className="w-full mt-4 grid grid-cols-2 gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  aria-hidden="true"
                  multiple
                />
                <button
                  onClick={handleUploadButtonClick}
                  disabled={loading}
                  className="bg-white text-kv-blue border-2 border-kv-blue font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-kv-blue disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
                >
                  <UploadIcon className="w-6 h-6 mr-3" />
                  {loading ? 'Đang xử lý...' : 'Thêm ảnh'}
                </button>
                <button
                    onClick={handleCreateGif}
                    disabled={isCreateDisabled}
                    aria-label={'Tạo GIF'}
                    className="w-full bg-kv-blue text-white font-bold text-xl py-3 px-6 rounded-lg hover:bg-kv-blue-dark transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-blue-300 disabled:bg-slate-400 disabled:text-slate-100 disabled:cursor-not-allowed"
                >
                    Tạo GIF
                </button>
              </div>
          </div>
        );
      case AppState.Processing:
        return <LoadingOverlay />;
      case AppState.Animating:
        return generatedGif ? <AnimationPlayer gifUrl={generatedGif} onBack={handleBack} /> : null;
      case AppState.Error:
        return (
          <div className="text-center bg-red-100/80 backdrop-blur-lg p-8 rounded-2xl max-w-md w-full border border-red-200 shadow-lg">
            <p className="text-red-800 mb-6 font-medium text-lg">{error}</p>
            <button
              onClick={handleBack}
              className="bg-kv-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-kv-blue-dark transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-red-100 focus-visible:ring-blue-500"
            >
              Thử lại
            </button>
          </div>
        );
    }
  };

  return (
    <div className="h-dvh flex flex-col">
        <SoftGlowBackground />
        <Header />
        <main className="w-full grow flex items-center justify-center min-h-0 p-4 sm:p-6 lg:p-8">
            {renderContent()}
        </main>
    </div>
  );
};

// Add ImageIcon to icons, or define here for simplicity if not adding to icons.tsx
const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
);

export default App;