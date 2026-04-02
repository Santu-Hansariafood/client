import { useEffect, useMemo, useState } from "react";

const SIZE = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;
const DIGITS = [1, 2, 3, 4, 5, 6];

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pattern = (r, c) =>
  (BOX_COLS * (r % BOX_ROWS) + Math.floor(r / BOX_ROWS) + c) % SIZE;

const buildSolvedBoard = () => {
  const rowGroups = shuffle([0, 1, 2]);
  const colGroups = shuffle([0, 1]);

  const rows = rowGroups.flatMap((g) => shuffle([0, 1]).map((r) => g * 2 + r));
  const cols = colGroups.flatMap((g) =>
    shuffle([0, 1, 2]).map((c) => g * 3 + c),
  );
  const nums = shuffle(DIGITS);

  return rows.map((r) => cols.map((c) => nums[pattern(r, c)]));
};

const makePuzzle = (solved, blanks = 18) => {
  const puzzle = solved.map((row) => [...row]);
  const cells = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
  for (let i = 0; i < blanks; i++) {
    const idx = cells[i];
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    puzzle[r][c] = 0;
  }
  return puzzle;
};

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const SudokuGame = () => {
  const [solution, setSolution] = useState([]);
  const [puzzle, setPuzzle] = useState([]);
  const [board, setBoard] = useState([]);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);

  const newGame = () => {
    const solved = buildSolvedBoard();
    const generatedPuzzle = makePuzzle(solved, 18);
    setSolution(solved);
    setPuzzle(generatedPuzzle);
    setBoard(generatedPuzzle.map((row) => [...row]));
    setStatus("");
    setTime(0);
    setRunning(true);
  };

  useEffect(() => {
    newGame();
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

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
    const ok = board.every((row, r) =>
      row.every((cell, c) => cell === solution[r][c]),
    );

    if (ok) {
      setStatus(`🎉 Solved in ${formatTime(time)}`);
      setRunning(false);
    } else {
      setStatus("❌ Some cells are incorrect");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto backdrop-blur-lg bg-white/70 border border-white/30 shadow-xl rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Sudoku 6x6</h2>
        <button
          onClick={newGame}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          New Game
        </button>
      </div>

      <div className="flex justify-between items-center mb-3 text-sm text-slate-600">
        <span>⏱ Time: {formatTime(time)}</span>
        <span>Filled: {filledCount}/36</span>
      </div>

      <div className="grid grid-cols-6 gap-1 bg-slate-300 p-1 rounded-lg">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isFixed = puzzle[r][c] !== 0;
            const isWrong = !isFixed && cell !== 0 && solution[r][c] !== cell;
            const isSelected = selected?.r === r && selected?.c === c;

            return (
              <input
                key={`${r}-${c}`}
                value={cell || ""}
                onClick={() => setSelected({ r, c })}
                onChange={(e) => onChange(r, c, e.target.value)}
                maxLength={1}
                className={`aspect-square text-center text-lg font-semibold rounded-md border transition
                ${
                  isFixed
                    ? "bg-slate-100 text-slate-700"
                    : isWrong
                      ? "bg-red-100 text-red-700"
                      : "bg-white"
                }
                ${isSelected ? "ring-2 ring-emerald-400 scale-105" : ""}
              `}
                disabled={isFixed}
              />
            );
          }),
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={checkAnswer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Check
        </button>
      </div>

      {status && (
        <p className="mt-3 text-center font-medium text-slate-700">{status}</p>
      )}
    </div>
  );
};

export default SudokuGame;
