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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notes</h3>
        {notes.map((note, index) => (
          <div key={index} className="flex items-center space-x-2">
            <textarea
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Note ${index + 1}`}
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
            />
            <button
              type="button"
              className="p-2 text-red-500 hover:text-red-700"
              onClick={() => removeNote(index)}
            >
              <AiOutlineMinus size={20} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center p-2 text-blue-500 hover:text-blue-700"
          onClick={addNote}
        >
          <AiOutlinePlus size={20} className="mr-2" /> Add Note
        </button>
      </div>
    </Suspense>
  );
};

export default NotesSection;
