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
        const [consigneesRes, groupsRes, commoditiesRes] = await Promise.all([
          axios.get("/consignees"),
          axios.get("/groups"),
          axios.get("/commodities"),
        ]);

        const consignees = consigneesRes.data.data || consigneesRes.data;
        const groups = groupsRes.data.data || groupsRes.data;
        const commodities = commoditiesRes.data.data || commoditiesRes.data;

        setConsigneeOptions(
          consignees
            .map((item) => ({
              value: item._id,
              label: item.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        setGroupOptions(
          groups
            .map((item) => ({
              value: item._id,
              label: item.groupName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        setCommodityOptions(
          commodities.map((item) => ({
            value: item._id,
            label: item.name,
            parameters: item.parameters || [],
          }))
        );
      } catch (error) {
        toast.error("Failed to load dropdown data");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleAddCommodity = useCallback(() => {
    setSelectedCommodities((prev) => [
      ...prev,
      {
        commodity: null,
        parameters: [],
        brokerage: "",
      },
    ]);
  }, []);

  
  const handleCommodityChange = useCallback(
    (index, selectedCommodity) => {
      const commodity = commodityOptions.find(
        (item) => item.value === selectedCommodity.value
      );

      setSelectedCommodities((prev) => {
        const updated = [...prev];

        updated[index] = {
          commodity: selectedCommodity,
          brokerage: "",
          parameters: (commodity?.parameters || []).map((param) => ({
            ...param,
            value: "",
          })),
        };

        return updated;
      });
    },
    [commodityOptions]
  );

  const availableCommodities = useMemo(() => {
    return commodityOptions.filter(
      (commodity) =>
        !selectedCommodities.some(
          (item) =>
            item.commodity && item.commodity.value === commodity.value
        )
    );
  }, [commodityOptions, selectedCommodities]);

  const handleParameterChange = useCallback(
    (commodityIndex, paramIndex, value) => {
      setSelectedCommodities((prev) =>
        prev.map((commodity, cIndex) => {
          if (cIndex === commodityIndex) {
            const updatedParams = commodity.parameters.map((param, pIndex) =>
              pIndex === paramIndex ? { ...param, value } : param
            );

            return { ...commodity, parameters: updatedParams };
          }
          return commodity;
        })
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!companyName || !companyEmail) {
      toast.error("Company name and email required");
      return;
    }

    const payload = {
      companyName,
      companyEmail,
      consigneeIds: selectedConsignee.map((c) => c.value),
      groupId: selectedGroup?.value || null,

      commodities: selectedCommodities.map((entry) => ({
        commodityId: entry.commodity?.value,
        brokerage: entry.brokerage,

        parameters: entry.parameters.map((param) => ({
          parameter: param.parameter,
          value: param.value,
        })),
      })),
    };

    try {
      const res = await axios.post("/companies", payload);

      if (res.status === 201) {
        toast.success("Company added successfully");

        setCompanyName("");
        setCompanyEmail("");
        setSelectedConsignee([]);
        setSelectedGroup(null);
        setSelectedCommodities([]);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add company"
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
      <div className="flex justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
          <h2 className="text-3xl font-semibold text-center mb-8">
            {addCompanyLable.company_title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">
                {addCompanyLable.company_name}
              </label>
              <DataInput
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {addCompanyLable.company_email}
              </label>
              <DataInput
                placeholder="Enter email"
                value={companyEmail}
                inputType="email"
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {addCompanyLable.consignee_title}
              </label>

              <DataDropdown
                options={consigneeOptions}
                selectedOptions={selectedConsignee}
                onChange={setSelectedConsignee}
                isMulti
                placeholder="Select consignee"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {addCompanyLable.group_title}
              </label>

              <DataDropdown
                options={groupOptions}
                selectedOptions={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="Select group"
              />
            </div>
          </div>
          {selectedCommodities.map((entry, index) => (
            <div
              key={index}
              className="bg-gray-100 p-4 mt-6 rounded-md"
            >
              <DataDropdown
                options={availableCommodities}
                selectedOptions={entry.commodity}
                onChange={(val) =>
                  handleCommodityChange(index, val)
                }
                placeholder="Select commodity"
              />

              <div className="grid grid-cols-2 gap-4 mt-4">

                {entry.parameters.map((param, pIndex) => (
                  <div key={param.parameter}>
                    <label className="text-xs">
                      {param.parameter}
                    </label>

                    <DataInput
                      placeholder={`Enter ${param.parameter}`}
                      value={param.value}
                      onChange={(e) =>
                        handleParameterChange(
                          index,
                          pIndex,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs">
                    Brokerage per Ton
                  </label>

                  <DataInput
                    placeholder="Enter brokerage"
                    value={entry.brokerage}
                    onChange={(e) => {
                      setSelectedCommodities((prev) => {
                        const updated = [...prev];
                        updated[index].brokerage =
                          e.target.value;
                        return updated;
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddCommodity}
            className="flex items-center text-blue-600 mt-6"
          >
            <FaPlus className="mr-2" />
            {addCompanyLable.add_another_commodity}
          </button>

          <div className="mt-10 text-center">
            <Buttons
              label="Submit"
              variant="primary"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default AddCompany;