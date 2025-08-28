import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ClickableStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
  onClick: () => void;
}

const ClickableStatsCard: React.FC<ClickableStatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  onClick
}) => {
  const { t } = useLanguage();
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50'
  };

  const [bgColor, textColor, cardBg] = colorClasses[color].split(' ');

  return (
    <div 
      className={`${cardBg} rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default ClickableStatsCard;
