import logoutConfirmLabel from "../../language/en/logoutConfirm";

const LogoutConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
        <p className="text-lg font-semibold text-gray-800 mb-4">
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
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
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
