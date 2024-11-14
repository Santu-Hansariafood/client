import LoginCarousel from "../../common/LoginCarousel/LoginCarousel";
import LoginForm from "../../components/LoginForm/LoginForm";

const Login = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/2 h-full flex-grow overflow-hidden">
        <LoginCarousel />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-6">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
