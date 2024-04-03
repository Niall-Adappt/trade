import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';

function Auth() {
  const [name, setName] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignIn = async (event: any) => {
    event.preventDefault();
    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/user/login/${ name }`);
      localStorage.setItem('stockkerToken', response.data.token);
      setIsSignedIn(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

    useEffect(() => {
        const token = localStorage.getItem('stockkerToken');
        if (token) {
          setIsSignedIn(true);
        }
      }, []);

  const handleSignOut = () => {
    localStorage.removeItem('stockkerToken');
    setIsSignedIn(false);
  };

  return (
    <div>
      {!isSignedIn && (
        <form onSubmit={handleSignIn}>
            <div className='flex flex-col'>
                <Input 
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase())}
                />
                <Button type="submit" >Sign in</Button>   
            </div>
        </form>
      )}
      {isSignedIn && (
        <Button onClick={handleSignOut} type="submit" >Sign out</Button>
      )}
    </div>
  );
}

export default Auth;
