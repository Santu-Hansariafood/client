import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHome, FaUser } from 'react-icons/fa';

const MobileFooter = ({ onProfileClick }) => {
  const navigate = useNavigate();

  const buttonClass = "flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors duration-200 p-2 rounded-lg w-20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50";

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.07)] flex items-center justify-around md:hidden z-30">
      <button onClick={() => navigate(-1)} className={buttonClass} aria-label="Go back">
        <FaArrowLeft size={18} />
        <span className="text-xs font-medium mt-1.5 tracking-wide">Back</span>
      </button>
      <button onClick={() => navigate('/dashboard')} className={buttonClass} aria-label="Go to homepage">
        <FaHome size={18} />
        <span className="text-xs font-medium mt-1.5 tracking-wide">Home</span>
      </button>
      <button onClick={onProfileClick} className={buttonClass} aria-label="Open profile menu">
        <FaUser size={18} />
        <span className="text-xs font-medium mt-1.5 tracking-wide">Profile</span>
      </button>
    </div>
  );
};

export default MobileFooter;
