import { useState, useEffect } from 'react';
import axios from 'axios';
import Tables from '../../../common/Tables/Tables';
import Actions from '../../../common/Actions/Actions';
import SearchBox from '../../../common/SearchBox/SearchBox';
import PopupBox from '../../../common/PopupBox/PopupBox'; // Import PopupBox
import { toast } from 'react-toastify';

const ListCompany = () => {
  const [companyData, setCompanyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Popup open state
  const [selectedCompany, setSelectedCompany] = useState(null); // Data for the popup

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/companies');
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

  const handleSearch = (searchTerm) => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    setFilteredData(
      companyData.filter((company) =>
        company.companyName.toLowerCase().includes(lowercasedSearchTerm)
      )
    );
  };

  const handleView = (index) => {
    setSelectedCompany(filteredData[index]); // Set selected company data
    setIsPopupOpen(true); // Open the popup
  };

  const handleEdit = (index) => {
    console.log('Edit company at index:', index);
  };

  const handleDelete = async (index) => {
    const companyId = filteredData[index]._id;
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

  const rows = filteredData.map((company, index) => [
    index + 1,
    company.companyName,
    company.companyPhone,
    company.companyEmail,
    company.consignee.join(', '),
    company.group,
    company.commodities
      .map((commodity) =>
        commodity.parameters.map((param) => `${param.parameter}: ${param.value}`).join(', ')
      )
      .join(' | '), // Combine all commodities' parameters
    company.mandiLicense || 'N/A', // Handle missing data gracefully
    company.activeStatus ? 'Active' : 'Inactive', // Default to Inactive if not present
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
      {isPopupOpen && (
        <PopupBox
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title={selectedCompany?.companyName || 'Company Details'}
        >
          <div>
            <p><strong>Phone:</strong> {selectedCompany?.companyPhone}</p>
            <p><strong>Email:</strong> {selectedCompany?.companyEmail}</p>
            <p><strong>Consignee:</strong> {selectedCompany?.consignee.join(', ')}</p>
            <p><strong>Group:</strong> {selectedCompany?.group}</p>
            <p><strong>Commodities:</strong></p>
            <ul>
              {selectedCompany?.commodities.map((commodity, idx) => (
                <li key={idx}>
                  <strong>{commodity.name}:</strong>{' '}
                  {commodity.parameters.map((param) => `${param.parameter}: ${param.value}`).join(', ')}
                </li>
              ))}
            </ul>
            <p><strong>Mandi License:</strong> {selectedCompany?.mandiLicense || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedCompany?.activeStatus ? 'Active' : 'Inactive'}</p>
          </div>
        </PopupBox>
      )}
    </div>
  );
};

export default ListCompany;
