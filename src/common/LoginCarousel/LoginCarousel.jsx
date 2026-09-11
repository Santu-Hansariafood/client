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
    arrows: false,
    infinite: true,
    speed: 900,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    cssEase: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    swipeToSlide: true,
    waitForAnimate: false,
    draggable: true,
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <Slider {...settings} className="h-full [&_.slick-list]:h-full [&_.slick-track]:h-full [&_.slick-slide]:h-full [&_.slick-slide>div]:h-full [&_.slick-dots]:bottom-8 [&_.slick-dots_li]:mx-1 [&_.slick-dots_button]:before:text-lg [&_.slick-dots_button]:before:text-white/80 [&_.slick-dots .slick-active button:before]:text-white">
        {carouselSlides.map((slide, index) => (
          <div key={index} className="relative h-screen">
            <LazyImage
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="h-full w-full object-cover scale-[1.02] transition-transform duration-[1200ms] ease-out"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/50" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <h1 className="mb-6 text-4xl font-bold drop-shadow-lg md:text-6xl animate-[fadeInUp_0.9s_ease-out]">
                {slide.title}
              </h1>
              <p className="max-w-2xl text-lg italic leading-relaxed md:text-2xl animate-[fadeInUp_1.1s_ease-out]">
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
