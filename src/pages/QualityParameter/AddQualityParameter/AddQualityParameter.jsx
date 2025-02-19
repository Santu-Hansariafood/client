import { useState, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
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
      await axios.post("http://88.222.215.234:5000/api/quality-parameters", payload);
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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Add Quality Parameter
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <DataInput
            placeholder="Name"
            value={formData.name}
            name="name"
            onChange={handleChange}
            required
            className="input-field"
          />
          <Buttons
            label="Submit"
            type="submit"
            variant="primary"
            size="md"
            className="button-field"
          />
        </form>
        <ToastContainer />
      </div>
    </Suspense>
  );
};

AddQualityParameter.propTypes = {
  onSubmit: PropTypes.func,
};

export default AddQualityParameter;
