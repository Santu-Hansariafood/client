const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 bg-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-600 font-medium text-center md:text-left">
          © 2025 - {currentYear} Hansaria Food Private Limited. All rights
          reserved.
        </p>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <span>Developed by</span>

          <a
            href="https://www.hansariafood.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent hover:opacity-80 transition"
          >
            Hansaria Food Pvt. Ltd.
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
