import PropTypes from "prop-types";
import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);

const EditBuyerPopup = ({ buyer, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [allConsignees, setAllConsignees] = useState([]);

  useEffect(() => {
    if (buyer) {
      setFormData({
        ...buyer,
        mobile: buyer.mobile || [""],
        email: buyer.email || [""],
        password: buyer.password || "",
        commodity: buyer.commodity || [""],
        // brokerage: buyer.brokerage || {},
        consignee: buyer.consignee || [],
        companyName: buyer.companyName || "",
      });
    }
  }, [buyer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, commoditiesRes, consigneesRes, companiesRes] =
          await Promise.all([
            axios.get("https://api.hansariafood.shop/api/companies"),
            axios.get("https://api.hansariafood.shop/api/commodities"),
            axios.get("https://api.hansariafood.shop/api/consignees"),
            axios.get("https://api.hansariafood.shop/api/companies"),
          ]);

        setGroups(
          groupsRes.data.map((group) => ({
            value: group.group,
            label: group.group,
            consignees: group.consignee || [],
          }))
        );
        setCommodities(commoditiesRes.data);
        setAllConsignees(consigneesRes.data);
        setCompanies(
          companiesRes.data.map((company) => ({
            value: company.companyName,
            label: company.companyName,
          }))
        );
      } catch (error) {
        toast.error("Failed to fetch required data.", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (name, index, updatedValue) => {
    const updatedArray = [...formData[name]];
    updatedArray[index] = updatedValue;
    setFormData({ ...formData, [name]: updatedArray });
  };

  const handleGroupChange = (selectedGroup) => {
    const group = groups.find((g) => g.value === selectedGroup.value);

    setFormData((prevData) => ({
      ...prevData,
      group: selectedGroup.value,
      consignee: [],
    }));

    setConsignees(group?.consignees || []);
  };

  const handleCompanyChange = (selectedCompany) => {
    setFormData((prevData) => ({
      ...prevData,
      companyName: selectedCompany?.value || "",
    }));
  };

  const addField = (name) => {
    setFormData({
      ...formData,
      [name]: [...formData[name], ""],
    });
  };

  const removeField = (name, index) => {
    setFormData({
      ...formData,
      [name]: formData[name].filter((_, i) => i !== index),
    });
  };

  const handleBrokerageChange = (commodity, value) => {
    setFormData({
      ...formData,
      brokerage: {
        ...formData.brokerage,
        [commodity]: value,
      },
    });
  };

  const addConsignee = (consignee) => {
    if (!formData.consignee.some((c) => c.value === consignee.value)) {
      setFormData({
        ...formData,
        consignee: [...formData.consignee, consignee],
      });
    } else {
      toast.warning("Consignee already added");
    }
  };

  const removeConsignee = (index) => {
    const updatedConsignees = formData.consignee.filter((_, i) => i !== index);
    setFormData({ ...formData, consignee: updatedConsignees });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        companyName: formData.companyName,
      };
      const response = await axios.put(
        `https://api.hansariafood.shop/api/buyers/${formData._id}`,
        payload
      );
      onUpdate(response.data);
      toast.success("Buyer updated successfully");
    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred while updating.";
      toast.error(message);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
        <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
          <button
            className="absolute top-3 right-3 text-gray-700 hover:text-red-500 font-bold text-lg"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>

          <div className="max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold mb-4">Edit Buyer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold">Buyer Name</label>
                  <DataInput
                    placeholder="Enter Name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold">Company</label>
                  <DataDropdown
                    options={companies}
                    selectedOptions={
                      formData.companyName
                        ? {
                            value: formData.companyName,
                            label: formData.companyName,
                          }
                        : null
                    }
                    onChange={handleCompanyChange}
                    placeholder="Select Company"
                  />
                </div>
                <div>
                  <label className="block font-semibold">Password</label>
                  <DataInput
                    placeholder="Enter Password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold">Group</label>
                  <DataDropdown
                    options={groups}
                    selectedOptions={groups.find(
                      (group) => group.value === formData.group
                    )}
                    onChange={handleGroupChange}
                    placeholder="Select Group"
                  />
                </div>
                <div>
                  <label className="block font-semibold">
                    Commodities & Brokerage
                  </label>
                  {formData.commodity.map((comm, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <select
                        value={comm}
                        onChange={(e) =>
                          handleArrayChange("commodity", index, e.target.value)
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select Commodity</option>
                        {commodities.map((commodity) => (
                          <option key={commodity._id} value={commodity.name}>
                            {commodity.name}
                          </option>
                        ))}
                      </select>
                      {/* <DataInput
                        placeholder="Brokerage"
                        value={formData.brokerage[comm] || ""}
                        onChange={(e) =>
                          handleBrokerageChange(comm, e.target.value)
                        }
                        inputType="number"
                      /> */}
                      <button
                        type="button"
                        onClick={() => removeField("commodity", index)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("commodity")}
                    className="text-blue-500 mt-2"
                  >
                    Add Commodity
                  </button>
                </div>
                <div>
                  <label className="block font-semibold">Mobile</label>
                  {formData.mobile.map((number, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <DataInput
                        placeholder="Enter Mobile Number"
                        value={number}
                        onChange={(e) =>
                          handleArrayChange("mobile", index, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeField("mobile", index)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("mobile")}
                    className="text-blue-500"
                  >
                    Add Mobile
                  </button>
                </div>
                <div>
                  <label className="block font-semibold">Email</label>
                  {formData.email.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <DataInput
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) =>
                          handleArrayChange("email", index, e.target.value)
                        }
                        inputType="email"
                      />
                      <button
                        type="button"
                        onClick={() => removeField("email", index)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("email")}
                    className="text-blue-500"
                  >
                    Add Email
                  </button>
                </div>
                <div>
                  <label className="block font-semibold">Consignee</label>
                  <div className="space-y-2">
                    {formData.consignee.map((consignee, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                      >
                        <span>{consignee.label}</span>
                        <button
                          type="button"
                          onClick={() => removeConsignee(index)}
                          className="p-1 bg-red-500 text-white rounded"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                  <DataDropdown
                    options={allConsignees.map((c) => ({
                      label: c.name,
                      value: c.name,
                    }))}
                    selectedOptions={null}
                    onChange={(selectedConsignee) => {
                      addConsignee({
                        label: selectedConsignee.label,
                        value: selectedConsignee.value,
                      });
                    }}
                    placeholder="Select Consignee"
                  />
                </div>
                <div>
                  <label className="block font-semibold">Status</label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 bg-green-500 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

EditBuyerPopup.propTypes = {
  buyer: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditBuyerPopup;