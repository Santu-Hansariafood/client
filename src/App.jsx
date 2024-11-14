import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext/AuthContext";

import Loading from "./common/Loading/Loading";
import "./App.css";

const Sidebar = lazy(() => import("./components/Sidebar/Sidebar"));
const Login = lazy(() => import("./pages/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const AddBuyer = lazy(() => import("./pages/Buyer/AddBuyer/AddBuyer"));
const ListBuyer = lazy(() => import("./pages/Buyer/BuyerList/BuyerList"));
const AddCommodity = lazy(() =>
  import("./pages/Commodity/AddCommodity/AddCommodity")
);
const ListCommodity = lazy(() =>
  import("./pages/Commodity/ListCommodity/ListCommodity")
);
const AddCompany = lazy(() => import("./pages/Company/AddCompany/AddCompany"));
const ListCompany = lazy(() =>
  import("./pages/Company/ListCompany/ListCompany")
);
const AddConsignee = lazy(() =>
  import("./pages/Consignee/AddConsignee/AddConsignee")
);
const ListConsignee = lazy(() =>
  import("./pages/Consignee/ListConsignee/ListConsignee")
);
const AddGroupOfCompany = lazy(() =>
  import("./pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany")
);
const ListGroupOfCompany = lazy(() =>
  import("./pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany")
);
const AddQualityParameter = lazy(() =>
  import("./pages/QualityParameter/AddQualityParameter/AddQualityParameter")
);
const ListQualityParameter = lazy(() =>
  import("./pages/QualityParameter/ListQualityParameter/ListQualityParameter")
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <Dashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Buyer Routes */}
            <Route
              path="/buyer/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddBuyer />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/buyer/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListBuyer />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Group of Company Routes */}
            <Route
              path="/group-of-company/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddGroupOfCompany />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/group-of-company/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListGroupOfCompany />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Company Routes */}
            <Route
              path="/company/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddCompany />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/company/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListCompany />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Consignee Routes */}
            <Route
              path="/consignee/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddConsignee />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/consignee/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListConsignee />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Commodity Routes */}
            <Route
              path="/commodity/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddCommodity />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/commodity/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListCommodity />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Quality Parameter Routes */}
            <Route
              path="/quality-parameter/add"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <AddQualityParameter />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/quality-parameter/list"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-4">
                      <ListQualityParameter />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Default and Fallback Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
