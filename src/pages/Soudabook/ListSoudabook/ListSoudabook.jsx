import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import DataInput from "../../../common/DataInput/DataInput";
import Tables from "../../../common/Tables/Tables";
import Actions from "../../../common/Actions/Actions";

const API_URL = "https://phpserver-v77g.onrender.com/api/agents";

const ListSoudabook = () => {
  const [agentName, setAgentName] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      toast.error("Failed to fetch agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (agentName.trim() === "") {
      toast.warning("Agent name cannot be empty.");
      return;
    }
    try {
      const response = await axios.post(API_URL, { name: agentName });
      setData((prevData) => [...prevData, response.data]);
      setAgentName("");
      toast.success("Agent added successfully.");
    } catch (error) {
      toast.error("Failed to add agent.");
    }
  };

  const handleView = (id) => {
    const agent = data.find((item) => item._id === id);
    if (agent) {
      toast.info(`Viewing agent: ${agent.name}`);
    }
  };

  const handleEdit = async (id) => {
    const agent = data.find((item) => item._id === id);
    if (!agent) return;

    const newName = prompt("Edit agent name:", agent.name);
    if (!newName || newName.trim() === "") {
      toast.warning("Agent name cannot be empty.");
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/${id}`, { name: newName });
      setData((prevData) =>
        prevData.map((item) => (item._id === id ? response.data : item))
      );
      toast.success("Agent updated successfully.");
    } catch (error) {
      toast.error("Failed to update agent.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setData((prevData) => prevData.filter((item) => item._id !== id));
      toast.success("Agent deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete agent.");
    }
  };

  const rows = useMemo(
    () =>
      data.map((item) => [
        item.name,
        <Actions
          key={item._id}
          onView={() => handleView(item._id)}
          onEdit={() => handleEdit(item._id)}
          onDelete={() => handleDelete(item._id)}
        />,
      ]),
    [data]
  );

  const headers = useMemo(() => ["Agent Name", "Actions"], []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">List Soudabook</h1>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
      />
      <form onSubmit={handleFormSubmit} className="mb-4">
        <DataInput
          placeholder="Enter Agent Name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          name="agentName"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
      {loading ? <Loading /> : <Tables headers={headers} rows={rows} />}
    </div>
  );
};

export default ListSoudabook;
