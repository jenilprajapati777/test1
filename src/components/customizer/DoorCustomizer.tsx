import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  AvatarConfig,
  DEFAULT_VISITOR_AVATAR,
  SKIN_TONES,
  HairStyle,
  TopStyle,
  BottomStyle,
  ShoesStyle,
  ExtraItem,
  validateAvatarConfig,
} from '../../types/avatar';
import { FacadeScene } from '../../world/FacadeScene';
import { AvatarModel } from '../../world/AvatarModel';
import { ChevronLeft, ChevronRight, ZoomIn, Ban, Sparkles, User, Palette, Shirt, Footprints } from 'lucide-react';
import { sanitizeText } from '../../lib/sanitize';

interface DoorCustomizerProps {
  initialName?: string;
  onEnter: (name: string, config: AvatarConfig) => void;
}

export const DoorCustomizer: React.FC<DoorCustomizerProps> = ({
  initialName = 'Maya',
  onEnter,
}) => {
  // Load stored avatar and name
  const [name, setName] = useState(() => {
    try {
      const stored = localStorage.getItem('museum_visitor_name');
      return stored ? sanitizeText(stored, 20) : sanitizeText(initialName, 20);
    } catch {
      return sanitizeText(initialName, 20);
    }
  });

  const [config, setConfig] = useState<AvatarConfig>(() => {
    try {
      const stored = localStorage.getItem('museum_avatar_config');
      if (stored) return validateAvatarConfig(JSON.parse(stored));
    } catch {
      // Fallback
    }
    return DEFAULT_VISITOR_AVATAR;
  });

  const [activeTab, setActiveTab] = useState<'skin' | 'hair' | 'outfit' | 'shoes' | 'extras'>('skin');
  const [isCloseUp, setIsCloseUp] = useState(false);
  const [avatarYaw, setAvatarYaw] = useState(0);
  const [isEntering, setIsEntering] = useState(false);
  const [doorProgress, setDoorProgress] = useState(0);

  const isDragging = useRef(false);
  const lastX = useRef(0);

  // Drag to rotate character
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setAvatarYaw((prev) => prev + dx * 0.015);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Cycle presets
  const presets: Array<Partial<AvatarConfig>> = [
    {
      preset: 'a',
      hairStyle: 'long',
      hairColor: '#3A261A',
      top: 'sweater',
      topColor: '#2B2D33',
      bottom: 'trousers',
      bottomColor: '#EDEBE6',
      shoes: 'boots',
      shoesColor: '#3A261A',
      extras: ['belt'],
    },
    {
      preset: 'b',
      hairStyle: 'bob',
      hairColor: '#1A1816',
      top: 'turtleneck',
      topColor: '#5C4A3A',
      bottom: 'jeans',
      bottomColor: '#243242',
      shoes: 'sneakers',
      shoesColor: '#FFFFFF',
      extras: ['glasses', 'belt'],
    },
    {
      preset: 'c',
      hairStyle: 'ponytail',
      hairColor: '#4A3525',
      top: 'blouse',
      topColor: '#EDEBE6',
      bottom: 'skirt',
      bottomColor: '#1B1D24',
      shoes: 'loafers',
      shoesColor: '#3D2B1F',
      extras: ['earrings', 'belt'],
    },
  ];

  const cyclePreset = (dir: 1 | -1) => {
    const curIdx = presets.findIndex((p) => p.preset === config.preset);
    const nextIdx = (curIdx + dir + presets.length) % presets.length;
    setConfig((prev) => ({
      ...prev,
      ...presets[nextIdx],
    }));
  };

  // Enter museum handler
  const handleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);

    const cleanName = sanitizeText(name, 20) || 'Visitor';
    try {
      localStorage.setItem('museum_visitor_name', cleanName);
      localStorage.setItem('museum_avatar_config', JSON.stringify(config));
    } catch {
      // Ignore quota error
    }

    // 900ms door opening animation
    const startTime = performance.now();
    const duration = 900;

    const animateDoor = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setDoorProgress(progress);

      if (progress < 1.0) {
        requestAnimationFrame(animateDoor);
      } else {
        setTimeout(() => {
          onEnter(cleanName, config);
        }, 200);
      }
    };

    requestAnimationFrame(animateDoor);
  };

  return (
    <div
      className="relative w-full h-full min-h-screen bg-bg0 overflow-hidden select-none flex flex-col md:flex-row"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 3D Facade & Character Scene */}
      <div className="relative flex-1 w-full h-[55vh] md:h-full">
        <Suspense fallback={null}>
          <Canvas
            shadows
            camera={{
              position: isCloseUp ? [0, 1.6, 1.4] : [0, 1.4, 3.2],
              fov: isCloseUp ? 40 : 50,
            }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
          >
            {/* Golden-hour Key Light */}
            <directionalLight
              position={[5, 6, 4]}
              intensity={1.8}
              color="#FFDFC2"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0005}
            />
            {/* Cool sky fill */}
            <hemisphereLight
              color="#FFE8D0"
              groundColor="#1C223A"
              intensity={0.65}
            />

            {/* Facade Scene with Doors */}
            <FacadeScene doorOpenProgress={doorProgress} />

            {/* Avatar at Museum Door */}
            <AvatarModel
              config={config}
              animState="idle"
              position={[0, 0.45, 0.8]}
              rotation={[0, avatarYaw, 0]}
            />
          </Canvas>
        </Suspense>

        {/* View Controls Overlay: ‹ › presets and Close-up pill */}
        <div className="absolute bottom-6 left-6 flex items-center gap-3 z-20">
          <button
            type="button"
            aria-label="Previous outfit preset"
            onClick={(e) => {
              e.stopPropagation();
              cyclePreset(-1);
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-ink shadow-md backdrop-blur-md flex items-center justify-center transition-all hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            aria-label="Next outfit preset"
            onClick={(e) => {
              e.stopPropagation();
              cyclePreset(1);
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-ink shadow-md backdrop-blur-md flex items-center justify-center transition-all hover:scale-105"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCloseUp(!isCloseUp);
            }}
            className="px-4 py-2 rounded-pill bg-white/80 hover:bg-white text-ink text-xs font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{isCloseUp ? 'Full body' : 'Close-up'}</span>
          </button>
        </div>

        {/* Rotation Hint */}
        <div className="absolute top-6 left-6 text-xs text-cream/70 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-pill border border-white/10 pointer-events-none">
          Drag character to rotate
        </div>
      </div>

      {/* Right Glass Customizer Panel (360px on desktop; bottom sheet on mobile) */}
      <div
        className="w-full md:w-[360px] glass-panel p-6 md:p-8 flex flex-col justify-between shrink-0 z-30 shadow-2xl overflow-y-auto max-h-[48vh] md:max-h-full rounded-t-card md:rounded-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="mb-4">
            <span className="text-[11px] text-stone-500 font-mono uppercase tracking-wider block">
              No account needed
            </span>
            <h2 className="font-serif text-3xl text-ink font-normal mt-0.5">Your character</h2>
          </div>

          {/* Icon Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-lg mb-6 text-stone-700">
            <button
              type="button"
              onClick={() => setActiveTab('skin')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === 'skin' ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Skin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hair')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === 'hair' ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Hair</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outfit')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === 'outfit' ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Outfit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shoes')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === 'shoes' ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Shoes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('extras')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === 'extras' ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extras</span>
            </button>
          </div>

          {/* Tab 1: Skin Tones */}
          {activeTab === 'skin' && (
            <div className="space-y-3">
              <span className="text-xs font-medium text-stone-700 block">Skin tone</span>
              <div className="grid grid-cols-4 gap-2.5">
                {SKIN_TONES.map((tone) => {
                  const isSelected = config.skin === tone.value;
                  return (
                    <button
                      key={tone.name}
                      type="button"
                      onClick={() => setConfig({ ...config, skin: tone.value })}
                      title={tone.name}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                        isSelected
                          ? 'border-ink scale-105 shadow-md ring-2 ring-ink/20'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                      style={{ backgroundColor: tone.value === 'original' ? '#F7F4EF' : tone.color }}
                    >
                      {tone.value === 'original' ? (
                        <Ban className="w-4 h-4 text-stone-500" />
                      ) : null}
                      <span className="text-[9px] font-medium text-stone-800 drop-shadow-sm">
                        {tone.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Hair Style & Colors */}
          {activeTab === 'hair' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-stone-700 block mb-2">Style</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['long', 'bob', 'ponytail', 'bun', 'short', 'curly'] as HairStyle[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setConfig({ ...config, hairStyle: st })}
                        className={`py-2 px-2 text-xs rounded-lg border capitalize font-medium transition-all ${
                          config.hairStyle === st
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-white/80 text-stone-700 border-black/10 hover:border-black/25'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-stone-700 block mb-2">Color</span>
                <div className="flex items-center gap-2">
                  {['#1A1816', '#3D2B1F', '#6E482B', '#A86A3D', '#D1A36A', '#9B2335'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConfig({ ...config, hairColor: c })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          config.hairColor === c ? 'border-ink scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Outfit Top & Bottom */}
          {activeTab === 'outfit' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-stone-700 block mb-2">Top</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['sweater', 'tee', 'turtleneck', 'vest-shirt', 'blouse'] as TopStyle[]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setConfig({ ...config, top: t })}
                        className={`py-2 px-2 text-xs rounded-lg border capitalize font-medium transition-all ${
                          config.top === t
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-white/80 text-stone-700 border-black/10 hover:border-black/25'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-stone-700 block mb-2">Bottom</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['trousers', 'jeans', 'skirt', 'shorts'] as BottomStyle[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setConfig({ ...config, bottom: b })}
                      className={`py-2 px-2 text-xs rounded-lg border capitalize font-medium transition-all ${
                        config.bottom === b
                          ? 'bg-ink text-cream border-ink'
                          : 'bg-white/80 text-stone-700 border-black/10 hover:border-black/25'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Shoes */}
          {activeTab === 'shoes' && (
            <div className="space-y-4">
              <span className="text-xs font-medium text-stone-700 block mb-2">Shoes</span>
              <div className="grid grid-cols-3 gap-2">
                {(['boots', 'sneakers', 'loafers'] as ShoesStyle[]).map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setConfig({ ...config, shoes: sh })}
                    className={`py-2 px-2 text-xs rounded-lg border capitalize font-medium transition-all ${
                      config.shoes === sh
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-white/80 text-stone-700 border-black/10 hover:border-black/25'
                    }`}
                  >
                    {sh}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Extras */}
          {activeTab === 'extras' && (
            <div className="space-y-4">
              <span className="text-xs font-medium text-stone-700 block mb-2">Accessories</span>
              <div className="grid grid-cols-2 gap-2">
                {(['glasses', 'beanie', 'earrings', 'scarf', 'belt'] as ExtraItem[]).map((item) => {
                  const has = config.extras.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const next = has
                          ? config.extras.filter((x) => x !== item)
                          : [...config.extras, item];
                        setConfig({ ...config, extras: next });
                      }}
                      className={`py-2.5 px-3 text-xs rounded-lg border capitalize font-medium transition-all flex items-center justify-between ${
                        has
                          ? 'bg-ink text-cream border-ink'
                          : 'bg-white/80 text-stone-700 border-black/10 hover:border-black/25'
                      }`}
                    >
                      <span>{item}</span>
                      {has && <span className="text-[10px] text-presence">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Name input and Enter button */}
        <div className="mt-6 pt-4 border-t border-black/10 space-y-3">
          <div>
            <label htmlFor="customizer-name" className="text-xs font-medium text-stone-700 block mb-1">
              Your name
            </label>
            <input
              id="customizer-name"
              type="text"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/90 border border-black/15 rounded-lg px-3.5 py-2 text-sm text-ink font-medium focus:outline-none focus:border-ink shadow-inner"
              placeholder="Your name"
            />
            <span className="text-[11px] text-stone-500 mt-1 block">
              Other visitors see this above your head.
            </span>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            disabled={isEntering}
            className="w-full py-3.5 rounded-pill bg-ink text-cream hover:bg-black font-medium transition-all duration-200 shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <span>{isEntering ? 'Opening doors...' : 'Enter the museum'}</span>
          </button>
        </div>
      </div>

      {/* Warm dissolve transition overlay during door open */}
      {isEntering && (
        <div
          className="absolute inset-0 bg-[#0B0D1F] pointer-events-none transition-opacity duration-700 z-50"
          style={{ opacity: Math.max(0, (doorProgress - 0.3) * 1.4) }}
        />
      )}
    </div>
  );
};
