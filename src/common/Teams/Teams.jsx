import { useEffect, useRef, useState } from "react";
import teamData from "../../data/teamData";
import { FaFacebook, FaInstagram, FaLinkedin, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const Teams = () => {
  const [visible, setVisible] = useState([]);
  const refs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => [...prev, entry.target.dataset.index]);
          }
        });
      },
      { threshold: 0.25 }
    );

    refs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-gray-50">

      {/* HERO HEADER */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center px-6 bg-gradient-to-br from-green-50 via-white to-green-100">

        {/* Home Button */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 px-5 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
        >
          <FaArrowLeft />
          Home
        </Link>

        {/* Background Blurs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-300 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-400 rounded-full blur-3xl opacity-30"></div>

        {/* Header Content */}
        <div className="relative z-10 max-w-3xl">

          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
            Our Leadership
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed">
            Meet the visionaries behind
            <span className="font-semibold text-green-700">
              {" "}Hansaria Food Private Limited
            </span>
            , driving innovation, trust, and growth in India&rsquo;s
            agricultural commodity trading ecosystem.
          </p>

          <div className="flex justify-center mt-8">
            <div className="h-1 w-28 bg-green-600 rounded-full"></div>
          </div>

        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-20">
        {teamData.map((member, index) => {
          const isVisible = visible.includes(index.toString());
          return (
            <div
              key={member.id}
              ref={(el) => (refs.current[index] = el)}
              data-index={index}
              className={`flex flex-col md:flex-row items-center gap-14 my-32 transition-all duration-1000
              ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}
              ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-20"
              }`}
            >
              <div className="md:w-1/2 w-full">
                <div className="relative group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="rounded-3xl shadow-xl w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>
              </div>
              <div className="md:w-1/2 w-full">

                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                  {member.name}
                </h2>

                <p className="text-green-600 font-semibold mt-2 text-lg">
                  {member.position}
                </p>

                <p className="text-gray-600 mt-5 leading-relaxed text-lg">
                  {member.description}
                </p>
                <div className="mt-6 border-l-4 border-green-600 pl-5">
                  <p className="italic text-gray-500 text-lg">
                    &ldquo;{member.quote}&rdquo;
                  </p>
                </div>
                <div className="flex gap-5 mt-6 text-2xl">
                  {member.social.facebook && (
                    <a
                      href={member.social.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:scale-125 transition"
                    >
                      <FaFacebook />
                    </a>
                  )}
                  {member.social.instagram && (
                    <a
                      href={member.social.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-500 hover:scale-125 transition"
                    >
                      <FaInstagram />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:scale-125 transition"
                    >
                      <FaLinkedin />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Teams;