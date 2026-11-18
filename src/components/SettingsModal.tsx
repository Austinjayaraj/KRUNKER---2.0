import React from 'react';
import { GameSettings, WeaponSkinId, CrosshairStyle } from '../game/types';
import { sound } from '../game/audio/soundSystem';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    if (key === 'masterVolume' || key === 'sfxVolume') {
      sound.setVolumes(updated.masterVolume, updated.sfxVolume);
    }
  };

  const crosshairColors = ['#38bdf8', '#22c55e', '#ef4444', '#f59e0b', '#ffffff', '#ec4899'];

  const crosshairStyles: { id: CrosshairStyle; name: string; desc: string }[] = [
    { id: 'cross', name: 'Classic Cross', desc: '4-axis tactical crosshair' },
    { id: 'dot', name: 'Precision Dot', desc: 'Zero-clutter center point' },
    { id: 'circle_dot', name: 'Circle & Dot', desc: 'Tactical holographic ring' },
    { id: 'chevron', name: 'Tactical Chevron', desc: 'Inverted apex targeting caret' },
    { id: 't_post', name: 'T-Post', desc: 'Open top 3-post crosshair' },
  ];

  const weaponSkins: { id: WeaponSkinId; name: string; desc: string; color: string }[] = [
    { id: 'tactical', name: 'Tactical Carbon', desc: 'Matte carbon fiber & gunmetal', color: '#1f2937' },
    { id: 'cyber', name: 'Cyber Neon', desc: 'Synthwave cyan & magenta iridescent glow', color: '#06b6d4' },
    { id: 'gold', name: '24K Damascus Gold', desc: 'Luxury engraved gold and damascus steel', color: '#d4af37' },
    { id: 'camo', name: 'Desert Spec-Ops', desc: 'Digital desert camouflage finish', color: '#786c52' },
    { id: 'hyperbeast', name: 'Hyperbeast Crimson', desc: 'Aggressive fiery red cyber glitch', color: '#dc2626' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-rajdhani">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-teko text-2xl font-bold">
              ⚙
            </div>
            <div>
              <h2 className="text-3xl font-bold font-teko uppercase tracking-wider text-white leading-none">
                SETTINGS & CUSTOMIZATION
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Calibrate input sensitivity, holographic reticles, audio, and visual feedback
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
          >
            Save & Close
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 flex-1">
          {/* Section 1: Holographic Reticle Customization with Live Preview */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <span>Holographic Reticle & Hit Feedback</span>
              <span className="text-[10px] text-slate-400 font-mono">LIVE PREVIEW</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              {/* Reticle Live Preview Box */}
              <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-xl p-4 min-h-[140px] relative overflow-hidden">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 absolute top-2 left-2">
                  Target Canvas
                </div>
                {/* Visual Target Mock Grid */}
                <div className="w-24 h-24 rounded-full border border-slate-800 flex items-center justify-center relative">
                  <div className="absolute w-12 h-12 rounded-full border border-slate-800/60 pointer-events-none" />
                  {/* Live Rendered Reticle */}
                  {settings.crosshairStyle === 'dot' ? (
                    <div
                      className="rounded-full shadow-[0_0_6px]"
                      style={{
                        backgroundColor: settings.crosshairColor,
                        boxShadow: `0 0 6px ${settings.crosshairColor}`,
                        width: `${Math.max(4, settings.crosshairSize * 0.4)}px`,
                        height: `${Math.max(4, settings.crosshairSize * 0.4)}px`,
                      }}
                    />
                  ) : settings.crosshairStyle === 'circle_dot' ? (
                    <div className="relative flex items-center justify-center">
                      <div
                        className="rounded-full border-2"
                        style={{
                          borderColor: settings.crosshairColor,
                          width: `${settings.crosshairSize * 2}px`,
                          height: `${settings.crosshairSize * 2}px`,
                        }}
                      />
                      {settings.crosshairDot && (
                        <div
                          className="absolute w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: settings.crosshairColor }}
                        />
                      )}
                    </div>
                  ) : settings.crosshairStyle === 'chevron' ? (
                    <div className="relative flex flex-col items-center">
                      <div
                        className="w-3 h-3 border-t-2 border-l-2 rotate-45"
                        style={{ borderColor: settings.crosshairColor }}
                      />
                      {settings.crosshairDot && (
                        <div
                          className="w-1 h-1 rounded-full mt-1"
                          style={{ backgroundColor: settings.crosshairColor }}
                        />
                      )}
                    </div>
                  ) : settings.crosshairStyle === 't_post' ? (
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute h-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          width: `${settings.crosshairSize}px`,
                          transform: `translateX(-${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      <div
                        className="absolute h-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          width: `${settings.crosshairSize}px`,
                          transform: `translateX(${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      <div
                        className="absolute w-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          height: `${settings.crosshairSize}px`,
                          transform: `translateY(${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      {settings.crosshairDot && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: settings.crosshairColor }}
                        />
                      )}
                    </div>
                  ) : (
                    // Classic Cross
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute w-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          height: `${settings.crosshairSize}px`,
                          transform: `translateY(-${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      <div
                        className="absolute w-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          height: `${settings.crosshairSize}px`,
                          transform: `translateY(${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      <div
                        className="absolute h-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          width: `${settings.crosshairSize}px`,
                          transform: `translateX(-${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      <div
                        className="absolute h-0.5"
                        style={{
                          backgroundColor: settings.crosshairColor,
                          width: `${settings.crosshairSize}px`,
                          transform: `translateX(${settings.crosshairGap + settings.crosshairSize / 2}px)`,
                        }}
                      />
                      {settings.crosshairDot && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: settings.crosshairColor }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reticle Controls */}
              <div className="md:col-span-2 space-y-3">
                {/* Style selector */}
                <div>
                  <span className="text-xs text-slate-300 block mb-1.5 font-semibold">Reticle Architecture</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {crosshairStyles.map((cs) => (
                      <button
                        key={cs.id}
                        onClick={() => {
                          sound.playUiClick();
                          handleChange('crosshairStyle', cs.id);
                        }}
                        onMouseEnter={() => sound.playUiHover()}
                        className={`p-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-left transition-all cursor-pointer ${
                          settings.crosshairStyle === cs.id
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="truncate">{cs.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reticle Color */}
                <div>
                  <span className="text-xs text-slate-300 block mb-1.5 font-semibold">Glow Color Palette</span>
                  <div className="flex items-center gap-2.5">
                    {crosshairColors.map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          sound.playUiClick();
                          handleChange('crosshairColor', col);
                        }}
                        onMouseEnter={() => sound.playUiHover()}
                        className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                          settings.crosshairColor === col ? 'scale-115 border-white shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size & Gap */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-mono-numbers mb-1">
                      <span className="text-slate-400">Size</span>
                      <span className="text-amber-400 font-bold">{settings.crosshairSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="24"
                      value={settings.crosshairSize}
                      onChange={(e) => handleChange('crosshairSize', parseInt(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono-numbers mb-1">
                      <span className="text-slate-400">Center Gap</span>
                      <span className="text-amber-400 font-bold">{settings.crosshairGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      value={settings.crosshairGap}
                      onChange={(e) => handleChange('crosshairGap', parseInt(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.crosshairDot}
                      onChange={(e) => handleChange('crosshairDot', e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                    />
                    <span>Center Precision Dot</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showDamageNumbers}
                      onChange={(e) => handleChange('showDamageNumbers', e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                    />
                    <span>Floating 3D Damage Numbers</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Weapon Finish & Skins */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-3">
              Weapon Finish & Camouflage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {weaponSkins.map((skin) => (
                <div
                  key={skin.id}
                  onClick={() => {
                    sound.playUiClick();
                    handleChange('weaponSkin', skin.id);
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    settings.weaponSkin === skin.id
                      ? 'bg-slate-800/90 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: skin.color }} />
                    <span className="text-sm font-bold font-teko uppercase tracking-wider text-white">
                      {skin.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{skin.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Input & Mouse Controls */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-3">
              Input & Camera Sensitivity
            </h3>
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs font-mono-numbers mb-1.5">
                  <span className="text-slate-300">Aim Sensitivity</span>
                  <span className="text-amber-400 font-bold">{settings.mouseSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={settings.mouseSensitivity}
                  onChange={(e) => handleChange('mouseSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono-numbers mb-1.5">
                  <span className="text-slate-300">Field of View (FOV)</span>
                  <span className="text-amber-400 font-bold">{settings.fov}°</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="115"
                  step="1"
                  value={settings.fov}
                  onChange={(e) => handleChange('fov', parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300">Invert Vertical Look (Y-Axis)</span>
                <input
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) => handleChange('invertY', e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Audio Synthesis */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-3">
              Audio Synthesis & Combat SFX
            </h3>
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs font-mono-numbers mb-1.5">
                  <span className="text-slate-300">Master Volume</span>
                  <span className="text-amber-400 font-bold">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono-numbers mb-1.5">
                  <span className="text-slate-300">SFX / Weapon Gunfire</span>
                  <span className="text-amber-400 font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
