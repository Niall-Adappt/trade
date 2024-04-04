import Auth from "@/components/auth";
import { Heading } from "@/components/ui/heading";

const SignInPage = () => {
    return (
      <div >
        <div className="py-3">
          <Heading title="Sign in" description=""/>
        </div>
        
        <Auth/>
      </div>
    );
  }
  
  export default SignInPage;