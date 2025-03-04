import { useCallback } from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Cards = ({ title, count, icon: Icon, link }) => {
  const navigate = useNavigate();

  const handleRedirect = useCallback(() => {
    navigate(link);
  }, [navigate, link]);

  return (
    <article
      className="relative bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-lg hover:bg-green-50 group cursor-pointer"
      onClick={handleRedirect}
      role="button"
      aria-label={`View details for ${title}`}
    >
      <div
        className="flex items-center justify-center w-12 h-12 bg-green-600 text-yellow-400 rounded-full mb-4 
        group-hover:bg-green-700 group-hover:text-white transition-all"
      >
        <Icon className="text-xl" loading="lazy" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-700">{count}</p>
      <div
        className="absolute top-6 right-6 p-2 bg-yellow-400 rounded-full text-green-800 
        group-hover:bg-green-700 group-hover:text-white transition-all"
      >
        <FaArrowRight loading="lazy" aria-hidden="true" />
      </div>
    </article>
  );
};

export default Cards;
