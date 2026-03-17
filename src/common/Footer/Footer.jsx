import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 px-4 bg-white/80 backdrop-blur-md border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-slate-600 text-sm font-medium">
          © {currentYear} Hansaria Food Private Limited. All rights reserved.
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <span>Developed by</span>
          <span className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Santu De
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
