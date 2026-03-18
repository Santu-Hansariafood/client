import { lazy, Suspense, useMemo } from "react";
import Loading from "../../common/Loading/Loading";

const LoginCarousel = lazy(
  () => import("../../common/LoginCarousel/LoginCarousel"),
);
const LoginForm = lazy(() => import("../../components/LoginForm/LoginForm"));

const Login = () => {
  const memoizedCarousel = useMemo(() => <LoginCarousel />, []);
  const memoizedLoginForm = useMemo(() => <LoginForm />, []);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-gray-100">
        <div className="hidden md:block md:w-1/2 h-full overflow-hidden">
          {memoizedCarousel}
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center min-h-screen md:min-h-0 p-4 sm:p-6 md:p-10">
          <div className="w-full max-w-md">{memoizedLoginForm}</div>
        </div>
      </div>
    </Suspense>
  );
};

export default Login;
