import { lazy } from "react";
const DataDropdown = lazy(()=>import("../../common/DataDropdown/DataDropdown"));

const GroupSelection = ({
  state,
  handleGroupChange,
  handleChange,
  handleCommodityChange,
}) => {
  const dropdowns = [
    {
      label: "Select Group",
      options: state.groupOptions,
      value: state.selectedGroup,
      onChange: handleGroupChange,
    },
    {
      label: "Select Consignee",
      options: state.consigneeOptions,
      value: state.selectedConsignee,
      onChange: (opt) => handleChange("selectedConsignee", opt),
    },
    {
      label: "Select Origin",
      options: state.originOptions,
      value: state.origin,
      onChange: (opt) => handleChange("origin", opt),
    },
    {
      label: "Select Commodity",
      options: state.commodityOptions,
      value: state.selectedCommodity,
      onChange: handleCommodityChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {dropdowns.map(({ label, options, value, onChange }, index) => (
        <div key={index}>
          <label className="block text-sm font-medium mb-2">{label}</label>
          <DataDropdown
            options={options}
            selectedOptions={value}
            onChange={onChange}
            placeholder={label}
          />
        </div>
      ))}
    </div>
  );
};

export default GroupSelection;
