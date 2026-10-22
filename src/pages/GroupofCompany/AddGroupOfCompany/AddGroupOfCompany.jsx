import { useState, lazy, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import addgroupcompanyLable from "../../../language/en/addGroupCompany";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const AddGroupOfCompany = () => {
  const [groupName, setGroupName] = useState("");

  const handleInputChange = (e) => {
    setGroupName(e.target.value);
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      await api.post("/groups", { groupName });
      clearApiCache();
      toast.success("Group added successfully");
      setGroupName("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add group");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add Group of Company"
        subtitle="Create a new group to link companies"
        icon={FaPlus}
        noContentCard
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
          <h2 className="mb-6 text-center font-serif text-xl font-semibold text-lux-ink sm:text-left sm:text-2xl">
            {addgroupcompanyLable.group_title}
          </h2>
          <label
            className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-lux-muted"
            htmlFor="groupName"
          >
            {addgroupcompanyLable.group_company_title}
          </label>
          <DataInput
            placeholder="Enter group of Company name"
            value={groupName}
            onChange={handleInputChange}
            name="groupName"
            required
          />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <Buttons
              label="Submit"
              onClick={handleSubmit}
              type="button"
              variant="primary"
              size="md"
            />
          </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddGroupOfCompany;
