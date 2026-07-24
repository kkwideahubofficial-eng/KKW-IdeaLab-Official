import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-9xl font-extrabold text-primary tracking-widest">404</h1>
      <div className="bg-primary px-2 text-sm rounded rotate-12 absolute text-primary-foreground">
        Page Not Found
      </div>
      <div className="mt-8 text-xl font-medium text-foreground">
        Oops! The page you are looking for does not exist.
      </div>
      <p className="mt-2 text-muted-foreground mb-8">
        It might have been moved or deleted.
      </p>
      <Link to="/">
        <Button size="lg">Return to Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;
