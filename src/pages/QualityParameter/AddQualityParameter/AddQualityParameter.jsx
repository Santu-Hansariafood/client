import { useState, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
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
      await api.post("/quality-parameters", payload);
      clearApiCache();
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
        <div className="mx-auto w-full max-w-3xl">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
              <div>
                <label className="block mb-2 font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Buttons
                  label="Submit"
                  type="submit"
                  variant="primary"
                  size="md"
                />
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
