import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/Tabs/Home";
import Jackpot from "./pages/Tabs/Jackpot";
import LoginPage from "./pages/LoginPage";
import Error from "./pages/Error/Error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <Error />,
  },
  {
    path: "/jackpot",
    element: <Jackpot />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
