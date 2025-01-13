import { FaUsers, FaStore, FaTruck } from "react-icons/fa";
import Cards from "../../../common/Cards/Cards";

const CardGrid = ({ counts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Cards title="Total Buyers" count={counts.buyers} icon={FaUsers} link="/buyer/list" />
      <Cards title="Total Sellers" count={counts.sellers} icon={FaStore} link="/seller-details/list" />
      <Cards title="Total Consignees" count={counts.consignees} icon={FaTruck} link="/consignee/list" />
    </div>
  );
};

export default CardGrid;
