import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";

const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const AddCompany = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [selectedConsignee, setSelectedConsignee] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCommodities, setSelectedCommodities] = useState([]);

  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consignees, groups, commodities] = await Promise.all([
          axios.get("http://localhost:5000/api/consignees"),
          axios.get("http://localhost:5000/api/groups"),
          axios.get("http://localhost:5000/api/commodities"),
        ]);

        setConsigneeOptions(
          consignees.data.map((item) => ({
            value: item.name,
            label: item.name,
          }))
        );
        setGroupOptions(
          groups.data.map((item) => ({
            value: item.groupName,
            label: item.groupName,
          }))
        );
        setCommodityOptions(
          commodities.data.map((item) => ({
            value: item._id,
            label: item.name,
            parameters: item.parameters,
          }))
        );
      } catch (error) {
        toast.error("Failed to load options. Please try again.");
      }
    };
    fetchData();
  }, []);

  const handleAddCommodity = useCallback(() => {
    setSelectedCommodities((prev) => [
      ...prev,
      { commodity: null, parameters: [] },
    ]);
  }, []);

  const handleCommodityChange = useCallback(
    (index, selectedCommodity) => {
      const commodity = commodityOptions.find(
        (item) => item.value === selectedCommodity.value
      );
      setSelectedCommodities((prev) => {
        const updatedCommodities = [...prev];
        updatedCommodities[index] = {
          commodity: selectedCommodity,
          parameters: commodity.parameters.map((param) => ({
            ...param,
            value: "",
          })),
        };
        return updatedCommodities;
      });
    },
    [commodityOptions]
  );

  const availableCommodities = useMemo(
    () =>
      commodityOptions.filter(
        (commodity) =>
          !selectedCommodities.some(
            (item) => item.commodity && item.commodity.value === commodity.value
          )
      ),
    [commodityOptions, selectedCommodities]
  );

  const handleParameterChange = useCallback(
    (commodityIndex, paramIndex, value) => {
      setSelectedCommodities((prev) =>
        prev.map((commodity, cIndex) => {
          if (cIndex === commodityIndex) {
            const updatedParameters = commodity.parameters.map(
              (param, pIndex) =>
                pIndex === paramIndex ? { ...param, value } : param
            );
            return { ...commodity, parameters: updatedParameters };
          }
          return commodity;
        })
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!companyName || !companyPhone || !companyEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    const companyData = {
      companyName,
      companyPhone,
      companyEmail,
      consignee: selectedConsignee.map((item) => item.value),
      group: selectedGroup ? selectedGroup.value : null,
      commodities: selectedCommodities.map((entry) => ({
        name: entry.commodity.label,
        parameters: entry.parameters.map((param) => ({
          parameter: param.parameter,
          value: param.value || "",
        })),
      })),
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/companies",
        companyData
      );
      if (response.status === 201) {
        toast.success("Company added successfully!");
        setCompanyName("");
        setCompanyPhone("");
        setCompanyEmail("");
        setSelectedConsignee([]);
        setSelectedGroup(null);
        setSelectedCommodities([]);
      }
    } catch (error) {
      toast.error(
        error.response
          ? error.response.data.message
          : "Error adding company. Please try again!"
      );
    }
  }, [
    companyName,
    companyPhone,
    companyEmail,
    selectedConsignee,
    selectedGroup,
    selectedCommodities,
  ]);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <ToastContainer />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-8">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
            <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
              Add Company
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Company Name
                </label>
                <DataInput
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Company Phone Number
                </label>
                <DataInput
                  placeholder="Enter company phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  inputType="tel"
                  maxLength="10"
                  minLength="10"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Company Email
                </label>
                <DataInput
                  placeholder="Enter company email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  inputType="email"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Consignee
                </label>
                <DataDropdown
                  options={consigneeOptions}
                  selectedOptions={selectedConsignee}
                  onChange={setSelectedConsignee}
                  placeholder="Select consignee"
                  isMulti
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Group
                </label>
                <DataDropdown
                  options={groupOptions}
                  selectedOptions={selectedGroup}
                  onChange={setSelectedGroup}
                  placeholder="Select group"
                />
              </div>
              {selectedCommodities.map((entry, index) => (
                <div
                  key={index}
                  className="col-span-1 md:col-span-2 bg-gray-100 p-4 rounded-md shadow-inner mt-4"
                >
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Quality of Commodity
                  </label>
                  <DataDropdown
                    options={availableCommodities}
                    selectedOptions={entry.commodity}
                    onChange={(commodity) =>
                      handleCommodityChange(index, commodity)
                    }
                    placeholder="Select commodity"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {entry.parameters.map((param, paramIndex) => (
                      <div key={param.parameter}>
                        <label className="text-xs font-medium text-gray-500">
                          {param.parameter}
                        </label>
                        <DataInput
                          placeholder={`Enter ${param.parameter}`}
                          value={param.value}
                          onChange={(e) =>
                            handleParameterChange(
                              index,
                              paramIndex,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddCommodity}
              className="flex items-center text-blue-600 hover:text-blue-800 mt-6"
            >
              <FaPlus className="mr-2" /> Add Another Commodity
            </button>
            <div className="mt-10 text-center">
              <Buttons
                label="Submit"
                onClick={handleSubmit}
                variant="primary"
              />
            </div>
          </div>
        </div>
      </Suspense>
    </>
  );
};

export default AddCompany;
