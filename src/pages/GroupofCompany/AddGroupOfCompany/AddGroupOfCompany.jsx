import { useState, lazy, Suspense, useMemo } from "react";
import Loading from "../../../common/Loading/Loading";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import addgroupcompanyLable from "../../../language/en/addGroupCompany";
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
      const response = await axios.post("http://localhost:5000/api/groups", {
        groupName,
      });
      toast.success("Group added successfully");
      setGroupName("");
      console.log(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add group");
      console.error("Error adding group:", error);
    }
  };

  const toastContainer = useMemo(
    () => (
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
    ),
    []
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {toastContainer}
        <div className="bg-white p-8 rounded-lg shadow-2xl transform transition-transform duration-500 hover:scale-105 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {addgroupcompanyLable.group_title}
          </h2>
          <label className="block text-sm font-medium mb-2" htmlFor="groupName">
            {addgroupcompanyLable.group_company_title}
          </label>
          <DataInput
            placeholder="Enter group of Company name"
            value={groupName}
            onChange={handleInputChange}
            name="groupName"
            required={true}
          />
          <div className="mt-4 align-middle">
            <Buttons
              label="Submit"
              onClick={handleSubmit}
              type="submit"
              variant="primary"
              size="md"
            />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default AddGroupOfCompany;
