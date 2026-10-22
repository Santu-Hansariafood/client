import React from "react";
import { useNavigate } from "react-router-dom";
import SudokuGame from "../../components/SudokuGame/SudokuGame";

const MarketAnalysis = () => {
  const navigate = useNavigate();

  return (
    <div className="lux-canvas flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="lux-card lux-gold-top mb-5 p-5 text-center sm:p-8">
          <h2 className="mb-3 font-serif text-2xl font-semibold text-lux-ink">
            Market Analysis
          </h2>
          <p className="mb-6 text-lux-muted">
            Playing zone while this page goes live.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            Go Back
          </button>
        </div>

        <SudokuGame title="Market Analysis Sudoku (6x6)" />
      </div>
    </div>
  );
};

export default MarketAnalysis;
