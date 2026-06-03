import React, { Suspense } from "react";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import Loading from "../../common/Loading/Loading";

const NotesSection = ({ notes, setNotes }) => {
  const handleNoteChange = (index, value) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = value;
    setNotes(updatedNotes);
  };

  const addNote = () => {
    setNotes([...notes, ""]);
  };

  const removeNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
  };

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Notes
      </label>
      <div className="space-y-4">
        {notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
            <textarea
              className="flex-1 min-h-[80px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              placeholder={`Note ${index + 1}`}
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
            />
            <button
              type="button"
              className="shrink-0 mt-2 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              onClick={() => removeNote(index)}
              aria-label="Remove note"
            >
              <AiOutlineMinus size={20} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium transition-colors"
          onClick={addNote}
        >
          <AiOutlinePlus size={20} /> Add Note
        </button>
      </div>
    </Suspense>
  );
};

export default NotesSection;
