  const handleCommodityChange = (index, selected) => {
    const newCommodities = [...companyInfo.commodities];
    const commodity = commodities.find(c => c._id === selected.value);
    newCommodities[index] = { 
      ...newCommodities[index], 
      commodityId: selected.value, 
      name: selected.label, 
      parameters: commodity ? commodity.parameters.map(p => ({ ...p, value: "" })) : []
    };
    setCompanyInfo({ ...companyInfo, commodities: newCommodities });
  };

  const handleBrokerageChange = (index, value) => {
    const newCommodities = [...companyInfo.commodities];
    newCommodities[index].brokerage = value;
    setCompanyInfo({ ...companyInfo, commodities: newCommodities });
  };

  const handleParameterChange = (commodityIndex, paramIndex, value) => {
    const newCommodities = [...companyInfo.commodities];
    newCommodities[commodityIndex].parameters[paramIndex].value = value;
    setCompanyInfo({ ...companyInfo, commodities: newCommodities });
  };

  const addCommodity = () => {
    const newCommodity = { commodityId: "", name: "", brokerage: "", parameters: [] };
    setCompanyInfo({ ...companyInfo, commodities: [...companyInfo.commodities, newCommodity] });
  };

  const removeCommodity = (index) => {
    const newCommodities = companyInfo.commodities.filter((_, i) => i !== index);
    setCompanyInfo({ ...companyInfo, commodities: newCommodities });
  };