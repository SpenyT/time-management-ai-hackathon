import { isRouteErrorResponse, useRouteError } from "react-router";

export default function ErrorBoundary() {
   const error = useRouteError();

   if (isRouteErrorResponse(error)) {
      return (
         <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">
               {error.status} {error.statusText}
            </h1>
            {error.data?.message ? <p>{error.data.message}</p> : null}
         </div>
      );
   }

   return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
         <h1 className="text-2xl font-bold">Something went wrong</h1>
         <p>Unexpected application error. Please try again.</p>
      </div>
   );
}