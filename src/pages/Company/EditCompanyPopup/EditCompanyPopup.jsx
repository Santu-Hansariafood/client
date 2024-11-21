import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";

const EditCompanyPopup = ({ company, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(company || {});
  const [consignees, setConsignees] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [qualityParameters, setQualityParameters] = useState([]);
  const [groups, setGroups] = useState([]);

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
            axios.get("http://localhost:5000/api/consignees"),
            axios.get("http://localhost:5000/api/commodities"),
            axios.get("http://localhost:5000/api/quality-parameters"),
            axios.get("http://localhost:5000/api/groups"),
          ]);
        setConsignees(consigneeRes.data);
        setCommodities(commodityRes.data);
        setQualityParameters(parameterRes.data);
        setGroups(groupRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data.");
      }
    };

    fetchData();
  }, []);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCommodityChange = (selectedOptions) => {
    const selectedCommodities = selectedOptions.map((option) => ({
      name: option.label,
      _id: option.value,
      parameters: [],
    }));
    setFormData({ ...formData, commodities: selectedCommodities });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `http://localhost:5000/api/companies/${formData._id}`,
        formData
      );

      onUpdate(response.data);
      toast.success("Company updated successfully.");
      onClose();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-3/4 overflow-auto max-h-screen">
        <button
          className="text-gray-500 hover:text-gray-800 mb-2"
          onClick={onClose}
        >
          X
        </button>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <DataInput
              placeholder="Company Name"
              value={formData.companyName || ""}
              onChange={handleChange}
              name="companyName"
              required
            />
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
                setFormData({ ...formData, group: { _id: selectedOption.value, groupName: selectedOption.label } })
              }
              placeholder="Select Group"
            />
            <DataDropdown
              options={consignees.map((consignee) => ({
                value: consignee.name,
                label: consignee.name,
              }))}
              selectedOptions={
                formData.consignee?.map((id) => {
                  const consignee = consignees.find((c) => c._id === id);
                  return { value: id, label: consignee?.name || "" };
                }) || []
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
            <DataInput
              placeholder="Phone Numbers (comma-separated)"
              value={formData.companyPhone || ""}
              onChange={handleChange}
              name="companyPhone"
            />
            <DataInput
              placeholder="Emails (comma-separated)"
              value={formData.companyEmail || ""}
              onChange={handleChange}
              name="companyEmail"
              inputType="email"
            />
            <div className="col-span-2">
              <label className="block font-semibold">Commodities</label>
              <DataDropdown
                options={commodities.map((commodity) => ({
                  value: commodity.name,
                  label: commodity.name,
                }))}
                selectedOptions={
                  formData.commodities?.map((commodity) => ({
                    value: commodity.name,
                    label: commodity.name,
                  })) || []
                }
                isMulti
                onChange={handleCommodityChange}
                placeholder="Select Commodities"
              />
              {formData.commodities?.map((commodity, commodityIndex) => (
                <div key={commodityIndex} className="border p-4 mt-2 rounded">
                  <p>
                    <strong>{commodity.name}</strong>
                  </p>
                  <label className="block mt-2 font-semibold">
                    Quality Parameters
                  </label>
                  <DataDropdown
                    options={qualityParameters.map((param) => ({
                      value: param.name,
                      label: param.name,
                    }))}
                    selectedOptions={
                      commodity.parameters?.map((param) => ({
                        value: param.parameter,
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
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

EditCompanyPopup.propTypes = {
  company: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditCompanyPopup;
