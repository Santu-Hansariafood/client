import { Suspense, useState } from "react";
import PropTypes from "prop-types";
import Loading from "../../../common/Loading/Loading";

const EditQualityParameter = ({ item, onClose, onSubmit }) => {
  const [name, setName] = useState(item.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { ...item, name };
    onSubmit(updatedData);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
        <div className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
          <div className="sticky top-0 z-20 border-b border-[#ece4d2] bg-lux-cream/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">Edit Quality Parameter</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4">
              <label className="block mb-2 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#e2d9c5] bg-lux-cream px-4 py-2.5 text-sm text-lux-ink outline-none transition focus:border-lux-emerald focus:ring-2 focus:ring-lux-emerald/20"
                required
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-[#ece4d2] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#e2d9c5] px-4 py-2 font-semibold text-lux-ink transition hover:bg-[#f5f0e4]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-lux-emerald to-lux-deep px-4 py-2 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
};

EditQualityParameter.propTypes = {
  item: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditQualityParameter;
