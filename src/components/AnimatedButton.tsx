import React from 'react';

interface AnimatedButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  icon?: React.ReactNode;
}

const AnimatedButton = ({ 
  text, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'default',
  size = 'default',
  icon
}: AnimatedButtonProps) => {
  // Determine button classes based on variant and size
  const getButtonClasses = () => {
    let classes = "animated-button ";
    
    // Size variations
    switch (size) {
      case 'sm':
        classes += "px-3 py-1.5 text-sm gap-2 ";
        break;
      case 'lg':
        classes += "px-8 py-4 text-lg gap-4 ";
        break;
      case 'default':
      default:
        classes += "px-6 py-3 text-base gap-3 ";
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'outline':
        classes += "border-2 border-primary bg-transparent text-primary ";
        break;
      case 'secondary':
        classes += "bg-secondary text-secondary-foreground ";
        break;
      case 'default':
      default:
        classes += "bg-primary text-primary-foreground ";
        break;
    }
    
    return classes;
  };

  return (
    <div className={`animated-button-wrapper ${className}`}>
      <button 
        className={getButtonClasses()}
        onClick={onClick}
        disabled={disabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="arr-2" viewBox="0 0 24 24">
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
        {icon && <span className="icon">{icon}</span>}
        <span className="text">{text}</span>
        <span className="circle" />
        <svg xmlns="http://www.w3.org/2000/svg" className="arr-1" viewBox="0 0 24 24">
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
        
        <style>{`
          .animated-button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 4px solid;
            border-color: transparent;
            font-weight: 600;
            border-radius: 100px;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          }

          .animated-button svg {
            position: absolute;
            width: 24px;
            z-index: 9;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }

          .animated-button .arr-1 {
            right: 16px;
          }

          .animated-button .arr-2 {
            left: -25%;
          }

          .animated-button .circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            opacity: 0;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }

          .animated-button .text {
            position: relative;
            z-index: 1;
            transform: translateX(-12px);
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }

          .animated-button .icon {
            position: relative;
            z-index: 1;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }

          /* Default variant styles */
          .animated-button {
            color: hsl(var(--primary-foreground));
            background-color: hsl(var(--primary));
            box-shadow: 0 0 0 2px hsl(var(--background));
          }

          .animated-button svg {
            fill: hsl(var(--primary-foreground));
          }

          .animated-button .circle {
            background-color: hsl(var(--primary-foreground) / 0.2);
          }

          /* Outline variant styles */
          .animated-button.border-2 {
            color: hsl(var(--primary));
            background-color: transparent;
            box-shadow: 0 0 0 2px hsl(var(--primary));
          }

          .animated-button.border-2 svg {
            fill: hsl(var(--primary));
          }

          .animated-button.border-2 .circle {
            background-color: hsl(var(--primary) / 0.2);
          }

          /* Secondary variant styles */
          .animated-button.bg-secondary {
            color: hsl(var(--secondary-foreground));
            background-color: hsl(var(--secondary));
            box-shadow: 0 0 0 2px hsl(var(--background));
          }

          .animated-button.bg-secondary svg {
            fill: hsl(var(--secondary-foreground));
          }

          .animated-button.bg-secondary .circle {
            background-color: hsl(var(--secondary-foreground) / 0.2);
          }

          .animated-button:hover {
            box-shadow: 0 0 0 12px transparent;
            border-radius: 12px;
          }

          .animated-button:hover .arr-1 {
            right: -25%;
          }

          .animated-button:hover .arr-2 {
            left: 16px;
          }

          .animated-button:hover .text {
            transform: translateX(12px);
          }

          .animated-button:hover .icon {
            transform: translateX(12px);
          }

          .animated-button:active {
            scale: 0.95;
            box-shadow: 0 0 0 4px hsl(var(--ring));
          }

          .animated-button:hover .circle {
            width: 220px;
            height: 220px;
            opacity: 1;
          }

          .animated-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </button>
    </div>
  );
};

export default AnimatedButton;