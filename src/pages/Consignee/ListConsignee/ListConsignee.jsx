import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tables from '../../../common/Tables/Tables';
import Actions from '../../../common/Actions/Actions';
import SearchBox from '../../../common/SearchBox/SearchBox'; // Optional, for adding a search feature

const ListConsignee = () => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchConsignees = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/consignees');
        setConsigneeData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching consignees:', error);
        setLoading(false);
      }
    };

    fetchConsignees();
  }, []);

  // Format data for table rows and add serial number
  const formattedRows = consigneeData
    .sort((a, b) => a.name.localeCompare(b.name)) // Sorting by name (change as needed)
    .map((consignee, index) => [
      index + 1, // Serial number
      consignee.name,
      consignee.phone,
      consignee.email,
      consignee.gst,
      consignee.pan,
      consignee.state,
      consignee.district,
      consignee.location,
      consignee.pin,
      consignee.contactPerson,
      consignee.mandiLicense,
      consignee.activeStatus,
      <Actions
        key={index}
        onView={() => console.log(`View ${consignee.name}`)}
        onEdit={() => console.log(`Edit ${consignee.name}`)}
        onDelete={() => console.log(`Delete ${consignee.name}`)}
      />,
    ]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Consignee List</h2>
      {/* Optional search feature */}
      <div className="mb-4">
        <SearchBox
          placeholder="Search Consignee..."
          items={consigneeData.map((consignee) => consignee.name)}
          onSearch={(filteredItems) => {
            console.log('Search results:', filteredItems);
          }}
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Tables
          headers={[
            'Sl No.',
            'Name',
            'Phone',
            'Email',
            'GST',
            'PAN',
            'State',
            'District',
            'Location',
            'Pin',
            'Contact Person',
            'Mandi License',
            'Active Status',
            'Actions',
          ]}
          rows={formattedRows}
        />
      )}
    </div>
  );
};

export default ListConsignee;
