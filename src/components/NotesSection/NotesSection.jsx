import { useState } from "react";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";

const NotesSection = () => {
  const [notes, setNotes] = useState([""]);

  const handleAddNote = () => {
    setNotes((prev) => [...prev, ""]);
  };

  const handleRemoveNote = (index) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNoteChange = (index, value) => {
    setNotes((prev) => {
      const updatedNotes = [...prev];
      updatedNotes[index] = value;
      return updatedNotes;
    });
  };

  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Notes
      </label>
      <div className="space-y-2">
        {notes.map((note, index) => (
          <div key={index} className="flex items-center gap-2">
            <textarea
              placeholder={`Note ${index + 1}`}
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {notes.length > 1 && (
              <button
                onClick={() => handleRemoveNote(index)}
                className="text-red-500"
                title="Remove Note"
              >
                <AiOutlineMinus size={20} />
              </button>
            )}
            {index === notes.length - 1 && (
              <button
                onClick={handleAddNote}
                className="text-green-500"
                title="Add Note"
              >
                <AiOutlinePlus size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesSection;
