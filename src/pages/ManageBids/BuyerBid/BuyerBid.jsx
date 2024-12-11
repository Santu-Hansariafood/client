import { lazy, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";

const BaseBid = lazy(() => import("../../../components/BaseBid/BaseBid"));

const BuyerBid = () => (
  <Suspense fallback={<Loading />}>
    <BaseBid type="buyer" ContentComponent={() => <div>BuyerBid</div>} />
  </Suspense>
);

export default BuyerBid;
