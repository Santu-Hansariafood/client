import { lazy, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";

const BaseBid = lazy(() => import("../../../components/BaseBid/BaseBid"));

const SupplierBid = () => (
  <Suspense fallback={<Loading />}>
    <BaseBid type="supplier" ContentComponent={() => <div>SupplierBid</div>} />
  </Suspense>
);

export default SupplierBid;
