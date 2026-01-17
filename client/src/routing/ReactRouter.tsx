import { createBrowserRouter } from "react-router";

import RootLayout from "@/routing/RootLayout";
import ErrorBoundary from "@/pages/error/ErrorBoundary";
import NotFound from "@/pages/error/NotFound";

import Dashboard from "@/pages/Dashboard";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: RootLayout,
    errorElement: <ErrorBoundary/>,
    children: [
      { id: "home", index: true, Component: Dashboard },
      { id: "not-found", path: "*", Component: NotFound },
    ]
  }
]);

export default router;