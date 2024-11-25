import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LazyImage from "../LazyImage/LazyImage";

const carouselImages = [
  {
    src: "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    placeholder: "https://via.placeholder.com/150",
  },
  {
    src: "https://images.pexels.com/photos/4040265/pexels-photo-4040265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    placeholder: "https://via.placeholder.com/150",
  },
  {
    src: "https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    placeholder: "https://via.placeholder.com/150",
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
    <div className="h-full">
      <Slider {...settings} className="h-full overflow-hidden">
        {carouselImages.map((image, index) => (
          <div key={index} className="h-full flex justify-center items-center">
            <LazyImage
              src={image.src}
              placeholder={image.placeholder}
              alt={`Slide ${index + 1}`}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default LoginCarousel;
