import { useNavigate } from "react-router-dom";
import SudokuGame from "../../components/SudokuGame/SudokuGame";

const BidHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white shadow-lg rounded-2xl p-5 sm:p-8 text-center mb-5">
          <h2 className="text-2xl font-semibold mb-3">Bid History</h2>
          <p className="text-gray-600 mb-6">
            Playing zone while this page goes live.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>

        <SudokuGame title="Bid History Sudoku (6x6)" />
      </div>
    </div>
  );
};

export default BidHistory;
