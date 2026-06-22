import { useState, useEffect } from 'react';

function CountdownTimer({ deadline, onExpire }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(deadline) - Date.now()));

  useEffect(() => {
    let fired = false;

    const interval = setInterval(() => {
      const left = Math.max(0, new Date(deadline) - Date.now());
      setRemaining(left);
      if (left === 0 && !fired) {
        fired = true;
        clearInterval(interval);
        onExpire();
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [deadline, onExpire]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = totalSeconds <= 10;

  return (
    <div className={`countdown-timer d-inline-flex align-items-center gap-2 px-3 py-2 rounded ${isUrgent ? 'bg-danger text-white' : 'bg-warning'}`}>
      <i className={`bi bi-alarm ${isUrgent ? 'text-white' : ''}`}></i>
      <span className="fw-bold fs-5">{display}</span>
    </div>
  );
}

export default CountdownTimer;
