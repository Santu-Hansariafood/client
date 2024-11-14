import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tables from '../../../common/Tables/Tables';
import Actions from '../../../common/Actions/Actions';
import SearchBox from '../../../common/SearchBox/SearchBox';
import { toast } from 'react-toastify';

const ListCompany = () => {
  const [companyData, setCompanyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/companies');
        // Sort data by `companyName` for demonstration; you can adjust the sorting as needed
        const sortedData = response.data.sort((a, b) =>
          a.companyName.localeCompare(b.companyName)
        );
        setCompanyData(sortedData);
        setFilteredData(sortedData);
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error('Failed to fetch company data');
      }
    };

    fetchCompanyData();
  }, []);

  // Search handler to filter table data
  const handleSearch = (searchTerm) => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    setFilteredData(
      companyData.filter((company) =>
        company.companyName.toLowerCase().includes(lowercasedSearchTerm)
      )
    );
  };

  const handleView = (index) => {
    console.log('View details for:', filteredData[index]);
  };

  const handleEdit = (index) => {
    console.log('Edit company at index:', index);
  };

  const handleDelete = async (index) => {
    const companyId = filteredData[index]._id; // assuming each company has a unique `_id`
    try {
      await axios.delete(`http://localhost:5000/api/companies/${companyId}`);
      const updatedData = filteredData.filter((_, i) => i !== index);
      setFilteredData(updatedData);
      setCompanyData(updatedData);
      toast.success('Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Convert company data to row format for Tables component
  const rows = filteredData.map((company, index) => [
    index + 1, // Serial Number
    company.companyName,
    company.companyPhone,
    company.companyEmail,
    company.consignee.join(', '), // Joining multi-values with a comma
    company.group,
    company.quality.join(', '), // Joining multi-values with a comma
    company.mandiLicense,
    company.activeStatus,
    <Actions
      key={index}
      onView={() => handleView(index)}
      onEdit={() => handleEdit(index)}
      onDelete={() => handleDelete(index)}
    />,
  ]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">List of Companies</h2>
      <SearchBox
        placeholder="Search companies..."
        items={companyData.map((company) => company.companyName)}
        onSearch={handleSearch}
      />
      <Tables
        headers={[
          'Sl No',
          'Company Name',
          'Phone Number',
          'Email',
          'Consignee',
          'Group',
          'Quality Parameter',
          'Mandi License',
          'Status',
          'Actions',
        ]}
        rows={rows}
      />
    </div>
  );
};

export default ListCompany;
