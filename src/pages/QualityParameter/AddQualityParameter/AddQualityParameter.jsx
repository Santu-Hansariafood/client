import { useState, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaSlidersH } from "react-icons/fa";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const AddQualityParameter = () => {
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a name.");
      return;
    }

    const payload = {
      name: formData.name,
    };

    try {
      await axios.post("/quality-parameters", payload);
      toast.success("Quality parameter added successfully!");
      setFormData({
        name: "",
      });
    } catch (error) {
      const errorMessage =
        error.response && error.response.data
          ? error.response.data.message
          : error.message;
      toast.error(`Failed to add quality parameter: ${errorMessage}`);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add Quality Parameter"
        subtitle="Create a new quality parameter to use in commodities and bidding"
        icon={FaSlidersH}
        noContentCard
      >
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Parameter name
                </label>
                <DataInput
                  placeholder="e.g. Moisture, Broken, Grade"
                  value={formData.name}
                  name="name"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Buttons label="Submit" type="submit" variant="primary" size="md" />
              </div>
            </form>
          </div>
        </div>
        <ToastContainer />
      </AdminPageShell>
    </Suspense>
  );
};

AddQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default AddQualityParameter;
