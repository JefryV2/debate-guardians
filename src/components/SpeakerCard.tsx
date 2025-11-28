import React, { useState } from 'react';
import { Speaker } from '@/context/DebateContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SpeakerCardProps {
  speaker: Speaker;
  isActive: boolean;
  onClick: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onNameChange?: (id: string, newName: string) => void;
}

const SpeakerCard = ({ 
  speaker, 
  isActive, 
  onClick,
  onRemove,
  showRemoveButton = false,
  onNameChange
}: SpeakerCardProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(speaker.name);

  const getColorClasses = () => {
    const colorMap: Record<string, string> = {
      'debate-blue': 'bg-blue-500',
      'debate-red': 'bg-red-500',
      'debate-green': 'bg-green-500',
      'debate-orange': 'bg-orange-500',
      'debate-purple': 'bg-purple-500',
      'debate-yellow': 'bg-yellow-500',
      'debate-cyan': 'bg-cyan-500',
      'debate-pink': 'bg-pink-500'
    };
    return colorMap[speaker.color] || 'bg-gray-500';
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(speaker.name);
  };

  const handleNameSave = () => {
    if (onNameChange && tempName.trim() !== '') {
      onNameChange(speaker.id, tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(speaker.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
        isActive 
          ? "border-2 border-blue-500 bg-blue-50 shadow-md" 
          : "border-border bg-card hover:border-primary/30",
        "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <img 
            src={speaker.avatar} 
            alt={speaker.name} 
            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${getColorClasses()}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-base h-8 rounded-md"
                autoFocus
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNameSave();
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNameCancel();
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{speaker.name}</h3>
                {onNameChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameEdit();
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Accuracy:</span>
                  <span className="text-sm font-medium text-foreground">{speaker.accuracyScore}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Claims:</span>
                  <span className="text-sm font-medium text-foreground">{speaker.totalClaims}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showRemoveButton && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SpeakerCard;