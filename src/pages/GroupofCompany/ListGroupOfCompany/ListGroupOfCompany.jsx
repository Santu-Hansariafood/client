import { useState, useEffect } from 'react';
import Tables from '../../../common/Tables/Tables';
import Actions from '../../../common/Actions/Actions';
import SearchBox from '../../../common/SearchBox/SearchBox';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ListGroupOfCompany = () => {
  const [groupsData, setGroupsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/groups');
        setGroupsData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        toast.error('Failed to fetch groups');
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, []);

  const handleSearch = (filteredItems) => {
    setFilteredData(
      groupsData.filter((group) =>
        filteredItems.some((item) =>
          group.groupName.toLowerCase().includes(item.toLowerCase())
        )
      )
    );
  };

  const handleView = (index) => {
    console.log('View details for:', filteredData[index]);
  };

  const handleEdit = (index) => {
    console.log('Edit group at index:', index);
  };

  const handleDelete = async (index) => {
    const groupToDelete = filteredData[index];
    try {
      await axios.delete(`http://localhost:5000/api/groups/${groupToDelete.id}`);
      const updatedData = filteredData.filter((_, i) => i !== index);
      setFilteredData(updatedData);
      setGroupsData(updatedData);
      toast.success('Group deleted successfully');
    } catch (error) {
      toast.error('Failed to delete group');
      console.error('Error deleting group:', error);
    }
  };

  const rows = filteredData.map((group, index) => [
    index + 1,
    group.groupName,
    <Actions
      key={index}
      onView={() => handleView(index)}
      onEdit={() => handleEdit(index)}
      onDelete={() => handleDelete(index)}
    />,
  ]);

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      <h2 className="text-2xl font-semibold mb-4">List of Groups of Companies</h2>
      
      <div className="mb-4">
        <SearchBox
          placeholder="Search groups..."
          items={groupsData.map((group) => group.groupName)}
          onSearch={handleSearch}
          className="p-2 border border-gray-300 rounded-lg w-full md:w-1/3 mx-auto"
        />
      </div>

      <Tables
        headers={['Sl. No', 'Group Name', 'Actions']}
        rows={rows}
      />
    </div>
  );
};

export default ListGroupOfCompany;
