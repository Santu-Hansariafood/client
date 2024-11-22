import { lazy, Suspense } from "react";
import Loading from "../../common/Loading/Loading";
const LoginCarousel = lazy(() =>
  import("../../common/LoginCarousel/LoginCarousel")
);
const LoginForm = lazy(() => import("../../components/LoginForm/LoginForm"));

const Login = () => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col md:flex-row h-screen">
        <div className="w-full md:w-1/2 h-full flex-grow overflow-hidden">
          <LoginCarousel />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-6">
          <LoginForm />
        </div>
      </div>
    </Suspense>
  );
};

export default Login;
