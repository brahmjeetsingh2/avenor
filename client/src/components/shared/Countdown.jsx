import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const useCountdown = (deadline) => {
  const calc = () => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      expired: false,
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return time;
};

const Countdown = ({ deadline, className = '' }) => {
  const { expired, days, hours, minutes, seconds } = useCountdown(deadline);

  if (!deadline) return null;

  if (expired) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-danger-500 ${className}`}>
        <Clock size={12} /> Deadline passed
      </span>
    );
  }

  const isUrgent = days < 2;
  const color = isUrgent ? 'text-danger-500' : days < 5 ? 'text-warning-500' : 'text-[var(--color-text-muted)]';

  if (days > 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color} ${className}`}>
        <Clock size={12} />
        {days}d {hours}h left
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold text-danger-500 animate-pulse ${className}`}>
      <Clock size={12} />
      {hours}h {minutes}m {seconds}s
    </span>
  );
};

export default Countdown;
