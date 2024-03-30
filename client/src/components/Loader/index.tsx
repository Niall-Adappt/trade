import React from 'react';
import { TailSpin } from 'react-loader-spinner';
import './style.css';

const Loading: React.FC = () => {
  return (
    <div className='loading w-full mx-auto'>
      <TailSpin color='#e3e8eb' height={80} width={80} />
    </div>
  );
};

export default Loading;
