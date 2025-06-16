import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { CountdownTimerProps } from '../types';

const CountdownTimer: React.FC<CountdownTimerProps> = ({ onComplete, countdownSeconds = 3 }) => {
  const [count, setCount] = useState(countdownSeconds);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [count, onComplete]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: '8rem',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {count}
      </Typography>
    </Box>
  );
};

export default CountdownTimer; 