import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const InteractionsPopup = ({ bidId, onClose }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const response = await axios.get(`/participatebids?bidId=${bidId}`);
        setInteractions(response.data.data || response.data);
      } catch (error) {
        toast.error('Failed to fetch interactions.');
      }
      setLoading(false);
    };
    fetchInteractions();
  }, [bidId]);

  const handleStatusChange = async (id, status, adminNotes) => {
    try {
      const response = await axios.patch(`/participatebids/${id}/status`, { status, adminNotes });
      // Update local state with the returned participation object which now includes sellerName
      setInteractions(interactions.map(i => i._id === id ? { ...response.data, sellerName: i.sellerName } : i));
      toast.success(`Interaction ${status}.`);
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Bid Interactions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {interactions.map(interaction => (
              <InteractionCard key={interaction._id} interaction={interaction} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InteractionCard = ({ interaction, onStatusChange }) => {
  const [notes, setNotes] = useState(interaction.adminNotes || '');

  const handleSave = (status) => {
    onStatusChange(interaction._id, status, notes);
  };

  const interactionTime = interaction.createdAt 
    ? new Date(interaction.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : "N/A";

  return (
    <div className={`p-4 rounded-lg border ${interaction.status === 'accepted' ? 'border-green-500 bg-green-50' : interaction.status === 'rejected' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Participant</p>
          <p className="text-lg font-semibold text-gray-800">{interaction.sellerName}</p>
          <p className="text-xs text-gray-400">{interaction.mobile}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Proposed Rate</p>
          <p className="text-lg font-semibold text-gray-800">₹{interaction.rate}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Proposed Quantity</p>
          <p className="text-lg font-semibold text-gray-800">{interaction.quantity} units</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Interaction Time</p>
          <p className="text-sm text-gray-600 mt-1">{interactionTime}</p>
        </div>
      </div>
      <div className="mt-4">
        <textarea
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Add admin notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        {interaction.status !== 'accepted' && (
          <button onClick={() => handleSave('accepted')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">Accept</button>
        )}
        {interaction.status !== 'rejected' && (
          <button onClick={() => handleSave('rejected')} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">Reject</button>
        )}
      </div>
    </div>
  );
};

export default InteractionsPopup;
