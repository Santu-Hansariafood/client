import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));
const DashboardLayout = lazy(() =>
  import("../../../layouts/DashboardLayout/DashboardLayout")
);
const Header = lazy(() => import("../../../common/Header/Header"));
const LogoutConfirmationModal = lazy(() =>
  import("../../../common/LogoutConfirmationModal/LogoutConfirmationModal")
);

const AddCommodity = () => {
  const [commodityName, setCommodityName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [extraFields, setExtraFields] = useState([{ parameter: "" }]);
  const [parametersOptions, setParametersOptions] = useState([]);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchParametersOptions = async () => {
      try {
        const response = await axios.get("/quality-parameters");
        const options = response.data
          .map((param) => ({ value: param._id, label: param.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setParametersOptions(options);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load parameters. Please try again.");
      }
    };

    fetchParametersOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "commodityName") setCommodityName(value);
    if (name === "hsnCode") setHsnCode(value);
  };

  const handleAddField = () => {
    setExtraFields([...extraFields, { parameter: "" }]);
  };

  const handleRemoveField = (index) => {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  };

  const handleExtraFieldChange = (index, name, value) => {
    const newFields = [...extraFields];
    newFields[index][name] = value;
    setExtraFields(newFields);
  };

  const handleSubmit = async () => {
    if (!commodityName || !hsnCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = {
      name: commodityName,
      hsnCode,
      parameters: extraFields.map((field) => ({
        parameterId: field.parameter?.value,
      })).filter((p) => p.parameterId),
    };

    try {
      await axios.post("/commodities", formData);
      toast.success("Commodity added successfully");
      setCommodityName("");
      setHsnCode("");
      setExtraFields([{ parameter: "" }]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message;
      toast.error(`Failed to add commodity: ${errorMessage}`);
    }
  };

  const getFilteredOptions = (index) => {
    const selectedParameters = extraFields
      .map((field) => field.parameter?.value)
      .filter(Boolean);
    return parametersOptions.filter(
      (option) => !selectedParameters.includes(option.value)
    );
  };

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Successfully logged out!");
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    <Suspense fallback={<Loading />}>
      <DashboardLayout>
        <Header onLogoutClick={() => setShowLogoutConfirmation(true)} />
        <main className="min-h-screen px-4 sm:px-6 py-10 bg-green-50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-yellow-300">
              <h2 className="text-3xl font-extrabold mb-8 text-center text-green-800">
                Add Commodity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DataInput
              placeholder="Enter commodity name"
              value={commodityName}
              onChange={handleInputChange}
              name="commodityName"
              required
            />
            <DataInput
              placeholder="Enter HSN code"
              value={hsnCode}
              onChange={handleInputChange}
              name="hsnCode"
              required
            />
          </div>

              <button
                onClick={handleAddField}
                className="mt-4 text-green-700 flex items-center space-x-2"
              >
                <AiOutlinePlus size={20} />
                <span className="font-medium">Add Quality Parameter</span>
              </button>

              {extraFields.map((field, index) => (
                <div
                  key={index}
                  className="mt-4 grid grid-cols-3 gap-4 items-center bg-gray-50 p-4 rounded-lg shadow-sm"
                >
              <DataDropdown
                options={getFilteredOptions(index)}
                selectedOptions={field.parameter}
                onChange={(option) =>
                  handleExtraFieldChange(index, "parameter", option)
                }
                placeholder="Select Parameter"
              />
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => handleRemoveField(index)}
                  className="text-red-500 flex items-center space-x-2"
                >
                  <AiOutlineMinus size={20} />
                  <span>Remove</span>
                </button>
              </div>
                </div>
              ))}

              <div className="flex justify-center mt-8">
                <Buttons
                  label="Submit"
                  onClick={handleSubmit}
                  variant="primary"
                  size="md"
                />
              </div>
            </div>
          </div>
        </main>
        {showLogoutConfirmation && (
          <LogoutConfirmationModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirmation(false)}
          />
        )}
      </DashboardLayout>
    </Suspense>
  );
};

export default AddCommodity;
