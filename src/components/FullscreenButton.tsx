import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onClick: () => void;
  className?: string;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ 
  isFullscreen, 
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center text-gray-600 hover:text-gray-800 focus:outline-none ${className}`}
      title={isFullscreen ? "Esci da schermo intero" : "Visualizza a schermo intero"}
    >
      {isFullscreen ? (
        <Minimize2 className="w-5 h-5" />
      ) : (
        <Maximize2 className="w-5 h-5" />
      )}
    </button>
  );
};

export default FullscreenButton;