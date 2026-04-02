import { useEffect, useMemo, useState } from "react";

const SIZE = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;
const DIGITS = [1, 2, 3, 4, 5, 6];

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pattern = (r, c) => (BOX_COLS * (r % BOX_ROWS) + Math.floor(r / BOX_ROWS) + c) % SIZE;

const buildSolvedBoard = () => {
  const rowGroups = shuffle([0, 1, 2]);
  const colGroups = shuffle([0, 1]);

  const rows = rowGroups.flatMap((g) => shuffle([0, 1]).map((r) => g * 2 + r));
  const cols = colGroups.flatMap((g) => shuffle([0, 1, 2]).map((c) => g * 3 + c));
  const nums = shuffle(DIGITS);

  return rows.map((r) => cols.map((c) => nums[pattern(r, c)]));
};

const makePuzzle = (solved, blanks = 18) => {
  const puzzle = solved.map((row) => [...row]);
  const cells = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
  for (let i = 0; i < blanks; i += 1) {
    const idx = cells[i];
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    puzzle[r][c] = 0;
  }
  return puzzle;
};

const SudokuGame = ({ title = "Sudoku 6x6" }) => {
  const [solution, setSolution] = useState([]);
  const [puzzle, setPuzzle] = useState([]);
  const [board, setBoard] = useState([]);
  const [status, setStatus] = useState("");

  const newGame = () => {
    const solved = buildSolvedBoard();
    const generatedPuzzle = makePuzzle(solved, 18);
    setSolution(solved);
    setPuzzle(generatedPuzzle);
    setBoard(generatedPuzzle.map((row) => [...row]));
    setStatus("");
  };

  useEffect(() => {
    newGame();
  }, []);

  const filledCount = useMemo(
    () => board.flat().filter((v) => v !== 0).length,
    [board],
  );

  const onChange = (r, c, value) => {
    if (puzzle[r][c] !== 0) return;
    const v = value.replace(/\D/g, "");
    const parsed = Number(v);
    setBoard((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => {
          if (ri !== r || ci !== c) return cell;
          if (!v) return 0;
          if (parsed < 1 || parsed > 6) return cell;
          return parsed;
        }),
      ),
    );
  };

  const checkAnswer = () => {
    const ok = board.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
    setStatus(ok ? "Great! Sudoku solved." : "Some cells are incorrect, keep trying.");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800">{title}</h3>
        <button
          onClick={newGame}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          New Game
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 mb-4">
        Fill digits 1-6. Each row, column, and 2x3 box must be unique.
      </p>

      <div className="grid grid-cols-6 gap-1 bg-slate-300 p-1 rounded-lg">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isFixed = puzzle[r]?.[c] !== 0;
            const isWrong = !isFixed && cell !== 0 && solution[r]?.[c] !== cell;
            return (
              <input
                key={`${r}-${c}`}
                value={cell === 0 ? "" : cell}
                onChange={(e) => onChange(r, c, e.target.value)}
                inputMode="numeric"
                maxLength={1}
                className={`aspect-square w-full text-center text-base sm:text-lg font-semibold rounded-md border outline-none ${
                  isFixed
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : isWrong
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : "bg-white text-slate-800 border-slate-200 focus:border-emerald-400"
                }`}
                disabled={isFixed}
              />
            );
          }),
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs sm:text-sm text-slate-500">
          Filled: {filledCount}/{SIZE * SIZE}
        </span>
        <button
          onClick={checkAnswer}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Check
        </button>
      </div>

      {status && <p className="mt-3 text-sm font-medium text-slate-700">{status}</p>}
    </div>
  );
};

export default SudokuGame;
