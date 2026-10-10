import React from 'react';
import {
  BarChart3,
  Users,
  Presentation,
  FileText,
  PieChart,
  Cloud,
  Smartphone,
} from 'lucide-react';

interface LeftFeaturePillsProps {
  onFeatureClick?: (featureId: string) => void;
}

export const LeftFeaturePills: React.FC<LeftFeaturePillsProps> = ({ onFeatureClick }) => {
  const features = [
    {
      id: 'marks',
      title: 'Enter Marks\nGenerate Results',
      icon: BarChart3,
    },
    {
      id: 'students',
      title: 'Student Management',
      icon: Users,
    },
    {
      id: 'reports',
      title: 'Class & Subject Reports',
      icon: Presentation,
    },
    {
      id: 'marksCards',
      title: 'Marks Card & PDF',
      icon: FileText,
    },
    {
      id: 'analytics',
      title: 'Gender & Caste Wise\nAnalysis',
      icon: PieChart,
    },
    {
      id: 'cloud',
      title: 'Secure Cloud Storage',
      icon: Cloud,
    },
    {
      id: 'devices',
      title: 'Works on Mobile & PC',
      icon: Smartphone,
    },
  ];

  return (
    <div className="flex flex-col justify-between py-1 w-full max-w-[250px] space-y-2.5 xl:space-y-3.5">
      {features.map((feat) => {
        const Icon = feat.icon;
        return (
          <div
            key={feat.id}
            onClick={() => onFeatureClick?.(feat.id)}
            className="flex items-center gap-3 group cursor-pointer transition transform hover:translate-x-1"
          >
            {/* Dark Blue Square Icon Button */}
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-[#073c7e] group-hover:bg-[#0256ba] text-white flex items-center justify-center shrink-0 shadow-md border border-blue-400/30 transition">
              <Icon className="w-5 h-5 text-white" />
            </div>

            {/* Feature Text */}
            <div className="text-xs font-bold text-white group-hover:text-amber-200 transition leading-snug drop-shadow-sm whitespace-pre-line">
              {feat.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};
