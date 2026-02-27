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
import addCompanyLable from "../../../language/en/addCompany";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../../common/DataDropdown/DataDropdown")
);
const Buttons = lazy(() => import("../../../common/Buttons/Buttons"));

const AddCompany = () => {
  const [companyName, setCompanyName] = useState("");
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
          axios.get("https://phpserver-kappa.vercel.app/api/consignees"),
          axios.get("https://phpserver-kappa.vercel.app/api/groups"),
          axios.get("https://phpserver-kappa.vercel.app/api/commodities"),
        ]);

        setConsigneeOptions(
          consignees.data
            .map((item) => ({
              value: item.name,
              label: item.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        setGroupOptions(
          groups.data
            .map((item) => ({
              value: item.groupName,
              label: item.groupName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        setCommodityOptions(
          commodities.data.map((item) => ({
            value: item._id,
            label: item.name,
            parameters: item.parameters,
          }))
        );
      } catch (error) {
        toast.error("Failed to load options. Please try again.", error);
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
          brokerage: "",
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
    if (!companyName || !companyEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    const companyData = {
      companyName,
      companyEmail,
      consignee: selectedConsignee.map((item) => item.value),
      group: selectedGroup ? selectedGroup.value : null,
      commodities: selectedCommodities.map((entry) => ({
        name: entry.commodity.label,
        brokerage: entry.brokerage,
        parameters: entry.parameters.map((param) => ({
          parameter: param.parameter,
          value: param.value || "",
        })),
      })),
    };

    try {
      const response = await axios.post(
        "https://phpserver-kappa.vercel.app/api/companies",
        companyData
      );
      if (response.status === 201) {
        toast.success("Company added successfully!");
        setCompanyName("");
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
    companyEmail,
    selectedConsignee,
    selectedGroup,
    selectedCommodities,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <ToastContainer />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
            {addCompanyLable.company_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1">
                {addCompanyLable.company_name}
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
                {addCompanyLable.company_email}
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
                {addCompanyLable.consignee_title}
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
                {addCompanyLable.group_title}
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
                  {addCompanyLable.quality_of_commodity}
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
                  {/* Brokerage Field */}
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Brokerage per Tons
                    </label>
                    <DataInput
                      placeholder="Enter brokerage amount"
                      value={entry.brokerage}
                      onChange={(e) =>
                        setSelectedCommodities((prev) => {
                          const updated = [...prev];
                          updated[index].brokerage = e.target.value;
                          return updated;
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddCommodity}
            className="flex items-center text-blue-600 hover:text-blue-800 mt-6"
          >
            <FaPlus className="mr-2" /> {addCompanyLable.add_another_commodity}
          </button>
          <div className="mt-10 text-center">
            <Buttons label="Submit" onClick={handleSubmit} variant="primary" />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default AddCompany;
