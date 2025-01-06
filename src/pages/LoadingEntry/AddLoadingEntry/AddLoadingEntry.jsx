import React, { useState } from "react";
import PropTypes from "prop-types";
import DataInput from "../../../common/DataInput/DataInput";
import DateSelector from "../../../common/DateSelector/DateSelector";
import FileUpload from "../../../common/FileUpload/FileUpload";
import SearchBox from "../../../common/SearchBox/SearchBox";
import "tailwindcss/tailwind.css";

const LoadingEntry = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (filteredItems) => {
    setSearchResults(filteredItems);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
        Loading Entry
      </h1>

      {/* Search Box */}
      <div className="flex flex-col mb-6">
        <label htmlFor="loadingEntrySearch" className="mb-2 font-semibold">
          Loading Entry Number
        </label>
        <SearchBox
          placeholder="Enter Loading Entry Number..."
          items={[]}
          onSearch={handleSearch}
        />
      </div>


      {/* Form */}
      <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        <div>
          <label>Loading Date</label>
          <DateSelector onChange={() => {}} />
        </div>
        <div>
          <label>Loading Weight</label>
          <DataInput placeholder="Enter weight" />
        </div>
        <div>
          <label>Lorry Number</label>
          <DataInput placeholder="Enter lorry number" />
        </div>

        {/* Row 2 */}
        <div>
          <label>Added Transport</label>
          <DataInput placeholder="Enter transport details" />
        </div>
        <div>
          <label>Driver Name</label>
          <DataInput placeholder="Enter driver name" />
        </div>
        <div>
          <label>Driver Phone Number</label>
          <DataInput placeholder="Enter phone number" />
        </div>

        {/* Row 3 */}
        <div>
          <label>Freight Rate</label>
          <DataInput placeholder="Enter freight rate" />
        </div>
        <div>
          <label>Total Freight</label>
          <DataInput placeholder="Enter total freight" />
        </div>
        <div>
          <label>Advance</label>
          <DataInput placeholder="Enter advance" />
        </div>

        {/* Row 4 */}
        <div>
          <label>Balance</label>
          <DataInput placeholder="Enter balance" />
        </div>
        <div>
          <label>Bill Number</label>
          <DataInput placeholder="Enter bill number" />
        </div>
        <div>
          <label>Date of Issue</label>
          <DateSelector onChange={() => {}} />
        </div>

        {/* Row 5 */}
        <div className="md:col-span-3">
          <label>Upload Document</label>
          <FileUpload
            label="Upload File"
            accept=".jpg,.png,.pdf"
            onFileChange={() => {}}
            minWidth={100}
            minHeight={100}
          />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-3 flex justify-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

LoadingEntry.propTypes = {};

export default LoadingEntry;
