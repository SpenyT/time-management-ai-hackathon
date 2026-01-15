import { RouterProvider } from "react-router/dom";
import router from "./routing/ReactRouter";

export default function App() {
  return (
    <RouterProvider router={router} />
  );
}