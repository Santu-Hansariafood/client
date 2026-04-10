import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LazyImage from "../LazyImage/LazyImage";

const carouselSlides = [
  {
    image:
      "https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    title: "Welcome to Hansaria Food",
    quote: "Quality you can trust, taste you will remember.",
  },
  {
    image:
      "https://images.pexels.com/photos/4040265/pexels-photo-4040265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    title: "Pure & Fresh",
    quote: "Delivering freshness from farm to your table.",
  },
  {
    image:
      "https://images.pexels.com/photos/235990/pexels-photo-235990.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    title: "Trusted Quality",
    quote: "Every grain inspected, every product perfected.",
  },
  {
    image:
      "https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    title: "Food Excellence",
    quote: "Where quality meets tradition.",
  },
  {
    image:
      "https://images.pexels.com/photos/34950/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    title: "Premium Selection",
    quote: "Committed to delivering the best food products.",
  },
];

const LoginCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    cssEase: "ease-in-out",
  };

  return (
    <div className="h-screen relative">
      <Slider {...settings} className="h-full">
        {carouselSlides.map((slide, index) => (
          <div key={index} className="relative h-screen">
            <LazyImage
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/40"></div>

            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-lg md:text-2xl italic max-w-2xl leading-relaxed">
                “{slide.quote}”
              </p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default LoginCarousel;
