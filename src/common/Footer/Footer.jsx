const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#e9e2d3] bg-lux-ivory/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm text-lux-muted font-medium text-center md:text-left">
          © 2025 - {currentYear} Hansaria Food Private Limited. All rights
          reserved.
        </p>

        <div className="flex items-center gap-1 text-sm text-lux-muted">
          <span>Developed by</span>

          <a
            href="https://www.hansariafood.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif font-bold bg-gradient-to-r from-lux-emerald to-lux-deep bg-clip-text text-transparent hover:opacity-80 transition"
          >
            Hansaria Food Pvt. Ltd.
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
