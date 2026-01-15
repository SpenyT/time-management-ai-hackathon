import { createBrowserRouter } from "react-router";

import RootLayout from "@/routing/RootLayout";
import ErrorBoundary from "@/pages/error/ErrorBoundary";
import NotFound from "@/pages/error/NotFound";

import HomePage from "@/pages/HomePage";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: RootLayout,
    errorElement: <ErrorBoundary/>,
    children: [
      { id: "home", index: true, Component: HomePage },
      { id: "not-found", path: "*", Component: NotFound },
    ]
  }
]);

export default router;