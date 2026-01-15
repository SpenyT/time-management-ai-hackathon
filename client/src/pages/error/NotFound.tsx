import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
   return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
         <h1 className="text-3xl font-bold text-primary">
            404 <span className="text-foreground">- Page Not Found</span>
         </h1>
         <p className="text-muted-foreground">
            The page you are looking for does not exist.
         </p>
         <Button variant="outline" asChild>
            <Link to="/">Go to home page</Link>
         </Button>
      </div>
   );
}