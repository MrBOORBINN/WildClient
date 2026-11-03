import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  ExternalLink, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Table as TableIcon,
  Palette
} from 'lucide-react';
import { DynamicWidgetData } from '../../types';

interface DynamicWidgetProps {
  data: DynamicWidgetData;
  onAction?: (actionText: string) => void;
}

export const DynamicWidget: React.FC<DynamicWidgetProps> = ({ data, onAction }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // 1. Selectable Options / Action Buttons
  if (data.type === 'options' || data.type === 'action_buttons') {
    return (
      <div className="my-3 p-4 rounded-2xl bg-[#1A1A1A] border border-[#414141] space-y-3">
        {data.title && (
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles size={14} className="text-[#9b72cb]" />
            <span>{data.title}</span>
          </div>
        )}
        {data.description && (
          <p className="text-xs text-[#A0A0A0] leading-relaxed">{data.description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {data.options?.map((opt, i) => {
            const isSelected = selectedOption === opt.value;
            return (
              <button
                key={opt.value || i}
                onClick={() => {
                  setSelectedOption(opt.value);
                  onAction?.(opt.action || opt.label);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected 
                    ? 'border-[#9b72cb] bg-[#9b72cb]/20 text-white' 
                    : 'border-[#414141] bg-[#2C2C2C] hover:bg-[#383838] hover:border-white/30 text-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{opt.label}</div>
                  {opt.description && (
                    <div className="text-[11px] text-[#A0A0A0] mt-0.5">{opt.description}</div>
                  )}
                </div>
                <ArrowRight size={14} className="text-[#A0A0A0] group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Multi-step Progress Indicator
  if (data.type === 'progress') {
    return (
      <div className="my-3 p-4 rounded-2xl bg-[#1A1A1A] border border-[#414141] space-y-3">
        {data.title && (
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-[#9b72cb]" />
              {data.title}
            </span>
            {typeof data.progressPercent === 'number' && (
              <span className="font-mono text-[#9b72cb]">{data.progressPercent}%</span>
            )}
          </div>
        )}

        {typeof data.progressPercent === 'number' && (
          <div className="w-full h-2 rounded-full bg-[#111111] overflow-hidden border border-[#414141]">
            <div 
              className="h-full bg-gradient-to-r from-[#9b72cb] to-[#4285f4] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
            />
          </div>
        )}

        {data.steps && data.steps.length > 0 && (
          <div className="space-y-2 pt-1">
            {data.steps.map((st, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                {st.status === 'completed' ? (
                  <CheckCircle2 size={14} className="text-[#34a853] shrink-0" />
                ) : st.status === 'current' ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#9b72cb] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#414141] shrink-0" />
                )}
                <span className={st.status === 'completed' ? 'text-white' : st.status === 'current' ? 'text-[#9b72cb] font-bold' : 'text-[#A0A0A0]'}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Structured Data Table
  if (data.type === 'table') {
    return (
      <div className="my-3 rounded-2xl bg-[#1A1A1A] border border-[#414141] overflow-hidden">
        {data.title && (
          <div className="px-4 py-3 border-b border-[#414141] flex items-center gap-2 text-xs font-bold text-white">
            <TableIcon size={14} className="text-[#9b72cb]" />
            <span>{data.title}</span>
          </div>
        )}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left">
            {data.headers && (
              <thead className="bg-[#2C2C2C] text-[#A0A0A0] uppercase font-bold text-[10px] tracking-wider border-b border-[#414141]">
                <tr>
                  {data.headers.map((h, i) => (
                    <th key={i} className="px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#414141]">
              {data.rows?.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#2C2C2C]/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-white">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. Color Palette Preview
  if (data.type === 'palette' && data.colors) {
    return (
      <div className="my-3 p-4 rounded-2xl bg-[#1A1A1A] border border-[#414141] space-y-3">
        {data.title && (
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Palette size={14} className="text-[#9b72cb]" />
            <span>{data.title}</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.colors.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                navigator.clipboard.writeText(c.hex);
                setCopiedHex(c.hex);
                setTimeout(() => setCopiedHex(null), 2000);
              }}
              className="p-2 rounded-xl bg-[#2C2C2C] border border-[#414141] hover:border-white/40 transition-all text-left group cursor-pointer"
            >
              <div 
                className="w-full h-12 rounded-lg border border-black/20 shadow-inner mb-2" 
                style={{ backgroundColor: c.hex }} 
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[10px] font-mono text-[#A0A0A0]">{c.hex}</div>
                </div>
                {copiedHex === c.hex ? (
                  <Check size={12} className="text-[#34a853]" />
                ) : (
                  <Copy size={12} className="text-[#A0A0A0] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
