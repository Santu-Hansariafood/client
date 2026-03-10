import { useState, lazy, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";
import axios from "axios";
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
      await axios.post("/groups", { groupName });
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
        <div className="max-w-lg mx-auto rounded-2xl border border-amber-200/60 bg-white shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center sm:text-left">
            {addgroupcompanyLable.group_title}
          </h2>
          <label
            className="block text-sm font-medium text-slate-700 mb-2"
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
          <div className="mt-6 flex justify-center sm:justify-start">
            <Buttons
              label="Submit"
              onClick={handleSubmit}
              type="button"
              variant="primary"
              size="md"
            />
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddGroupOfCompany;
