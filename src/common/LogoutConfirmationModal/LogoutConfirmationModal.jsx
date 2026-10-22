import logoutConfirmLabel from "../../language/en/logoutConfirm";

const LogoutConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-[#062e25]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-lux-cream rounded-2xl border border-[#e9e2d3] shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] p-6 w-80 text-center">
        <p className="text-lg font-serif font-semibold text-lux-ink mb-4">
          {logoutConfirmLabel.ask_logout}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={onConfirm}
          >
            {logoutConfirmLabel.yes_logout}
          </button>
          <button
            className="px-4 py-2 bg-[#f2eee2] text-lux-ink border border-[#e6dcc4] rounded-lg hover:bg-lux-ivory hover:border-[#dccfa8]"
            onClick={onCancel}
          >
            {logoutConfirmLabel.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
