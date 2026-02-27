import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);

const EditCompanyPopup = ({ company, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(company || {});
  const [consignees, setConsignees] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [qualityParameters, setQualityParameters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consigneeRes, commodityRes, parameterRes, groupRes] =
          await Promise.all([
            axios.get("https://phpserver-kappa.vercel.app/api/consignees"),
            axios.get("https://phpserver-kappa.vercel.app/api/commodities"),
            axios.get("https://phpserver-kappa.vercel.app/api/quality-parameters"),
            axios.get("https://phpserver-kappa.vercel.app/api/groups"),
          ]);
        setConsignees(consigneeRes.data);
        setCommodities(commodityRes.data);
        setQualityParameters(parameterRes.data);
        setGroups(groupRes.data);
      } catch (error) {
        toast.error("Failed to load required data.", error);
      }
    };

    fetchData();
  }, []);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCommodityAdd = () => {
    if (selectedCommodity) {
      const newCommodity = {
        name: selectedCommodity.label,
        _id: selectedCommodity.value,
        brokerage: "",
        parameters: [],
      };
      setFormData({
        ...formData,
        commodities: [...(formData.commodities || []), newCommodity],
      });
      setSelectedCommodity(null);
    } else {
      toast.error("Please select a commodity to add.");
    }
  };

  const handleCommodityRemove = (index) => {
    const updatedCommodities = [...formData.commodities];
    updatedCommodities.splice(index, 1);
    setFormData({ ...formData, commodities: updatedCommodities });
  };

  const handleParameterChange = (commodityIndex, selectedOptions) => {
    const updatedCommodities = [...formData.commodities];
    updatedCommodities[commodityIndex].parameters = selectedOptions.map(
      (option) => ({
        parameter: option.label,
        _id: option.value,
        value: "",
      })
    );
    setFormData({ ...formData, commodities: updatedCommodities });
  };

  const handleParameterValueChange = (commodityIndex, parameterIndex, value) => {
    const updatedCommodities = [...formData.commodities];
    updatedCommodities[commodityIndex].parameters[parameterIndex].value = value;
    setFormData({ ...formData, commodities: updatedCommodities });
  };

  const handleBrokerageChange = (commodityIndex, value) => {
    const updatedCommodities = [...formData.commodities];
    updatedCommodities[commodityIndex].brokerage = value;
    setFormData({ ...formData, commodities: updatedCommodities });
  };

  const handleArrayChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `https://phpserver-kappa.vercel.app/api/companies/${formData._id}`,
        formData
      );

      onUpdate(response.data);
      toast.success("Company updated successfully.");
      onClose();
    } catch (error) {
      toast.error("Failed to update company.", error);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-full sm:w-3/4 lg:w-2/3 max-h-screen overflow-auto relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>
          <h2 className="text-2xl font-bold mb-4 text-center">
            Edit Company Details
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <DataInput
                  placeholder="Company Name"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  name="companyName"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Group
                </label>
                <DataDropdown
                  options={groups.map((group) => ({
                    value: group.groupName,
                    label: group.groupName,
                  }))}
                  selectedOptions={{
                    value: formData.group?.groupName,
                    label: formData.group?.groupName || "Select Group",
                  }}
                  onChange={(selectedOption) =>
                    setFormData({
                      ...formData,
                      group: {
                        _id: selectedOption.value,
                        groupName: selectedOption.label,
                      },
                    })
                  }
                  placeholder="Select Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Consignees
                </label>
                <DataDropdown
                  options={consignees.map((consignee) => ({
                    value: consignee.name,
                    label: consignee.name,
                  }))}
                  selectedOptions={
                    formData.consignee?.map((name) => ({
                      value: name,
                      label: name,
                    })) || []
                  }
                  isMulti
                  onChange={(selectedOptions) =>
                    handleArrayChange(
                      "consignee",
                      selectedOptions.map((option) => option.value)
                    )
                  }
                  placeholder="Select Consignees"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Commodities
                </label>
                <div className="flex items-center gap-2">
                  <DataDropdown
                    options={commodities.map((commodity) => ({
                      value: commodity._id,
                      label: commodity.name,
                    }))}
                    selectedOptions={selectedCommodity}
                    onChange={(option) => setSelectedCommodity(option)}
                    placeholder="Select Commodity"
                  />
                  <button
                    type="button"
                    onClick={handleCommodityAdd}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Add
                  </button>
                </div>

                {formData.commodities?.map((commodity, commodityIndex) => (
                  <div
                    key={commodityIndex}
                    className="border p-4 mt-2 rounded relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleCommodityRemove(commodityIndex)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      title="Remove Commodity"
                    >
                      ✖
                    </button>
                    <label className="block mt-2 font-semibold">Brokerage</label>
                    <DataInput
                      placeholder="Enter Brokerage"
                      value={commodity.brokerage || ""}
                      onChange={(e) =>
                        handleBrokerageChange(commodityIndex, e.target.value)
                      }
                    />
                    <p className="font-semibold">{commodity.name}</p>
                    <label className="block mt-2 font-semibold">
                      Quality Parameters
                    </label>
                    <DataDropdown
                      options={qualityParameters.map((param) => ({
                        value: param._id,
                        label: param.name,
                      }))}
                      selectedOptions={
                        commodity.parameters?.map((param) => ({
                          value: param._id,
                          label: param.parameter,
                        })) || []
                      }
                      isMulti
                      onChange={(selectedOptions) =>
                        handleParameterChange(commodityIndex, selectedOptions)
                      }
                      placeholder="Select Quality Parameters"
                    />
                    {commodity.parameters.map((param, paramIndex) => (
                      <div
                        key={paramIndex}
                        className="flex items-center gap-4 mt-2"
                      >
                        <p className="flex-1">{param.parameter}</p>
                        <DataInput
                          placeholder="Value"
                          value={param.value || ""}
                          onChange={(e) =>
                            handleParameterValueChange(
                              commodityIndex,
                              paramIndex,
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
};

EditCompanyPopup.propTypes = {
  company: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditCompanyPopup;
