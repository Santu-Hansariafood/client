import { useCallback, useEffect, useState } from "react";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaTrash,
  FaUserTie,
} from "react-icons/fa";
import { toast } from "react-toastify";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import DataInput from "../../common/DataInput/DataInput";
import PopupBox from "../../common/PopupBox/PopupBox";
import api, { clearApiCache } from "../../utils/apiClient/apiClient";

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogMode, setDialogMode] = useState("");
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/agents");
      if (!Array.isArray(response.data)) {
        throw new Error("Agent list response is invalid");
      }
      setAgents(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleAdd = async (event) => {
    event.preventDefault();
    const agentName = name.trim();
    if (!agentName) {
      toast.error("Enter an agent name");
      return;
    }

    setSaving(true);
    try {
      await api.post("/agents", { name: agentName });
      clearApiCache();
      setName("");
      toast.success("Agent added successfully");
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add agent");
    } finally {
      setSaving(false);
    }
  };

  const openDialog = (agent, mode) => {
    setSelectedAgent(agent);
    setEditName(agent.name);
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setSelectedAgent(null);
    setDialogMode("");
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const agentName = editName.trim();
    if (!agentName) {
      toast.error("Enter an agent name");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/agents/${selectedAgent._id}`, { name: agentName });
      clearApiCache();
      toast.success("Agent updated successfully");
      closeDialog();
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"?`)) return;

    try {
      await api.delete(`/agents/${agent._id}`);
      clearApiCache();
      toast.success("Agent deleted successfully");
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete agent");
    }
  };

  return (
    <AdminPageShell
      title="Agent Management"
      subtitle="Manage agent names used when recording a Sauda."
      icon={FaUserTie}
      onRefresh={fetchAgents}
      isLoading={loading && agents.length === 0}
    >
      <div className="space-y-6">
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:flex-row sm:items-end sm:p-5"
        >
          <div className="flex-1">
            <DataInput
              label="Agent Name"
              floatingLabel={false}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter agent name"
              maxLength={100}
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mb-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft shadow-sm transition hover:shadow-lg disabled:opacity-60 sm:mb-5"
          >
            <FaPlus aria-hidden />
            Add Agent
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-[#ece4d2] bg-white">
          <div className="flex items-center justify-between border-b border-[#ece4d2] bg-lux-ivory px-4 py-3 sm:px-5">
            <h2 className="font-serif font-semibold text-lux-ink">Agent List</h2>
            <span className="text-xs text-lux-muted">{agents.length} agents</span>
          </div>
          {loading ? (
            <p className="p-6 text-center text-sm text-lux-muted">
              Loading agents…
            </p>
          ) : agents.length === 0 ? (
            <p className="p-6 text-center text-sm text-lux-muted">
              No agents have been added.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-white text-xs uppercase tracking-wide text-lux-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold sm:px-5">Agent Name</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Added</th>
                    <th className="px-4 py-3 text-right font-semibold sm:px-5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent._id} className="border-t border-[#f0eadc]">
                      <td className="px-4 py-3 font-medium text-lux-ink sm:px-5">
                        {agent.name}
                      </td>
                      <td className="px-4 py-3 text-lux-muted sm:px-5">
                        {agent.createdAt
                          ? new Date(agent.createdAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDialog(agent, "view")}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e6dcc4] px-3 text-xs font-semibold text-lux-emerald hover:bg-lux-ivory"
                            aria-label={`View ${agent.name}`}
                          >
                            <FaEye aria-hidden /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDialog(agent, "edit")}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                            aria-label={`Edit ${agent.name}`}
                          >
                            <FaEdit aria-hidden /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(agent)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            aria-label={`Delete ${agent.name}`}
                          >
                            <FaTrash aria-hidden /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PopupBox
        isOpen={Boolean(selectedAgent)}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Agent" : "Agent Details"}
        width="w-[95vw] sm:w-[32rem]"
        height="h-auto max-h-[90vh]"
      >
        {selectedAgent &&
          (dialogMode === "edit" ? (
            <form onSubmit={handleEdit} className="space-y-4">
              <DataInput
                label="Agent Name"
                floatingLabel={false}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={100}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="min-h-10 rounded-xl border border-[#e6dcc4] px-4 text-xs font-semibold text-lux-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-10 rounded-xl bg-lux-emerald px-4 text-xs font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#ece4d2] bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-lux-muted">
                  Agent Name
                </p>
                <p className="mt-1 font-serif text-lg font-semibold text-lux-ink">
                  {selectedAgent.name}
                </p>
              </div>
              <p className="text-xs text-lux-muted">
                Added{" "}
                {selectedAgent.createdAt
                  ? new Date(selectedAgent.createdAt).toLocaleString("en-IN")
                  : "date unavailable"}
              </p>
            </div>
          ))}
      </PopupBox>
    </AdminPageShell>
  );
};

export default AgentManagement;
