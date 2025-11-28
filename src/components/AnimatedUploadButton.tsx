import React from 'react';

interface AnimatedUploadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isUploading?: boolean;
}

const AnimatedUploadButton = ({ onClick, disabled = false, isUploading = false }: AnimatedUploadButtonProps) => {
  return (
    <div className="animated-upload-wrapper">
      <button 
        className={`button ${isUploading ? 'uploading' : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 160 48">
          <rect className="border" x="1" y="1" width="158" height="46" rx="16" ry="16" pathLength={100} />
          <rect className="loading" x="1" y="1" width="158" height="46" rx="16" ry="16" pathLength={100} />
          <svg className="done-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path className="done done-cloud" pathLength={100} d="M 6.5,20 Q 4.22,20 2.61,18.43 1,16.85 1,14.58 1,12.63 2.17,11.1 3.35,9.57 5.25,9.15 5.88,6.85 7.75,5.43 9.63,4 12,4 14.93,4 16.96,6.04 19,8.07 19,11 q 1.73,0.2 2.86,1.5 1.14,1.28 1.14,3 0,1.88 -1.31,3.19 Q 20.38,20 18.5,20 Z" />
            <path className="done done-check" pathLength={100} d="M 7.515,12.74 10.34143,15.563569 15.275,10.625" />
          </svg>
        </svg>
        <div className="txt-upload">Upload</div>
      </button>
      
      <style>{`
        .button {
          position: relative;
          width: 10rem;
          height: 3rem;
          cursor: pointer;
          border: none;
          background: none;
        }

        .button svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .border {
          stroke: hsl(var(--foreground));
          stroke-width: 2px;
          fill: transparent;
          stroke-dasharray: 25;
          transition: fill 0.25s;
          animation: 4s linear infinite stroke-animation;
        }

        .button:hover .border {
          fill: hsl(var(--foreground) / 0.1);
        }

        .button:focus .border {
          transition: fill 0.25s 7.75s;
          fill: transparent;
        }

        @keyframes stroke-animation {
          0% {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .txt-upload {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--foreground));
          font-weight: 500;
        }

        .txt-upload::after {
          content: "";
        }

        .button:focus .rect {
          stroke-dasharray: 50;
        }
        
        .button:focus .border {
          stroke: transparent;
        }

        .button:focus .txt-upload {
          opacity: 0;
          transition: opacity 0.25s 8s;
        }

        .button:focus .txt-upload::after {
          animation: 0.66666s anim step-end forwards,
            1.33333s 0.6666s anim2 linear infinite alternate;
        }

        @keyframes anim {
          0% {
            content: "i";
          }
          50% {
            content: "in";
          }
          to {
            content: "ing";
          }
        }

        @keyframes anim2 {
          0% {
            content: "ing";
          }
          33% {
            content: "ing.";
          }
          66% {
            content: "ing..";
          }
          to {
            content: "ing...";
          }
        }

        .loading {
          stroke: hsl(var(--primary));
          stroke-width: 2px;
          fill: none;
          stroke-dasharray: 0 100;
        }

        .button:focus .loading {
          transition: stroke 0.5s 7.5s, stroke-dasharray 8s 0.5s ease-out;
          stroke: hsl(var(--primary));
          stroke-dasharray: 100 0;
        }

        .done {
          fill: none;
          stroke: hsl(var(--foreground));
          stroke-dasharray: 0 100;
        }

        .button:focus .done-cloud {
          transition: stroke-dasharray 0.75s 8.5s ease-out;
          stroke-dasharray: 100 0;
        }

        .button:focus .done-check {
          transition: stroke-dasharray 0.5s 9.2s ease-out;
          stroke: hsl(var(--primary));
          stroke-dasharray: 100 0;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AnimatedUploadButton;