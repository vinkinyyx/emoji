import React, { useState, useCallback, useRef } from 'react';
import { Hero } from './components/Hero';
import { StickerCard } from './components/StickerCard';
import { StickerEditor } from './components/StickerEditor';
import { StickerData, StickerPlan } from './types';
import { planStickerPack, generateStickerImage } from './services/geminiService';
import { processStickerImage, createZipPackage } from './services/imageProcessor';

const App: React.FC = () => {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Ref to handle processing queue cleanly without useEffect dependency loops
  const stickersRef = useRef<StickerData[]>([]);

  // Update local state and ref simultaneously
  const updateSticker = useCallback((id: number, updates: Partial<StickerData>) => {
    setStickers(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      stickersRef.current = next;
      return next;
    });
  }, []);

  const handleGenerate = async (topic: string, style: string) => {
    setIsProcessing(true);
    setStickers([]);
    stickersRef.current = [];

    try {
      // 1. Planning Phase
      const plans = await planStickerPack(topic, style);
      
      const initialStickers: StickerData[] = plans.map(p => ({
        ...p,
        status: 'pending'
      }));
      
      setStickers(initialStickers);
      stickersRef.current = initialStickers;

      // 2. Generation Phase (Parallel execution in batches)
      // We process 4 at a time to be kind to the API and browser
      const batchSize = 4;
      for (let i = 0; i < initialStickers.length; i += batchSize) {
        const batch = initialStickers.slice(i, i + batchSize);
        await Promise.all(batch.map(item => generateAndProcessSingleSticker(item)));
      }

    } catch (error) {
      console.error("Workflow failed", error);
      alert("Failed to generate stickers. Please check console or try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndProcessSingleSticker = async (sticker: StickerData) => {
    updateSticker(sticker.id, { status: 'generating' });

    try {
      // A. Generate
      const rawImage = await generateStickerImage(sticker.visualPrompt);
      updateSticker(sticker.id, { status: 'processing', rawImageUrl: rawImage });

      // B. Process (Remove BG + Stroke + Caption)
      const processed = await processStickerImage(rawImage, sticker.caption);
      
      updateSticker(sticker.id, { 
        status: 'complete', 
        processedImageUrl: processed 
      });

    } catch (err) {
      console.error(`Failed ID ${sticker.id}`, err);
      updateSticker(sticker.id, { status: 'error' });
    }
  };

  const handleEditorUpdate = async (id: number, newCaption: string) => {
    const sticker = stickers.find(s => s.id === id);
    if (!sticker || !sticker.rawImageUrl) return;

    updateSticker(id, { status: 'processing', caption: newCaption });
    
    // Reprocess with existing raw image but new caption
    try {
      const processed = await processStickerImage(sticker.rawImageUrl, newCaption);
      updateSticker(id, { status: 'complete', processedImageUrl: processed });
    } catch (e) {
      updateSticker(id, { status: 'error' });
    }
  };

  const handleRegenerateSingle = async (id: number) => {
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    await generateAndProcessSingleSticker(sticker);
  };

  const handleExport = async () => {
    const completed = stickers.filter(s => s.status === 'complete');
    if (completed.length === 0) return;
    await createZipPackage(completed);
  };

  return (
    <div className="min-h-screen pb-20">
      <Hero onGenerate={handleGenerate} isProcessing={isProcessing} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Results Grid */}
        {stickers.length > 0 ? (
           <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Preview (4x4)</h2>
              <button 
                onClick={handleExport}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download WeChat Pack
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stickers.map(sticker => (
                <StickerCard 
                  key={sticker.id} 
                  data={sticker} 
                  onClick={() => setEditingId(sticker.id)}
                />
              ))}
            </div>
           </>
        ) : (
          <div className="text-center py-20 text-gray-400">
             <div className="text-6xl mb-4 opacity-30">✨</div>
             <p className="text-lg">Enter a topic above to generate your sticker pack.</p>
          </div>
        )}

      </main>

      {/* Editor Modal */}
      {editingId && stickers.find(s => s.id === editingId) && (
        <StickerEditor
          sticker={stickers.find(s => s.id === editingId)!}
          isOpen={!!editingId}
          onClose={() => setEditingId(null)}
          onUpdate={handleEditorUpdate}
          onRegenerate={handleRegenerateSingle}
        />
      )}
    </div>
  );
};

export default App;
