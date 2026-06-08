import { useState, useRef, useEffect } from 'react';

/**
 * 6-digit OTP input with auto-focus, auto-submit, and paste support
 */
const OTPInput = ({ length = 6, onComplete, disabled = false }) => {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    // Auto-focus next
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === length - 1) {
      const code = newValues.join('');
      if (code.length === length) {
        onComplete?.(code);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length > 0) {
      const newValues = Array(length).fill('');
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i];
      }
      setValues(newValues);

      // Focus last filled or next empty
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      if (pasted.length === length) {
        onComplete?.(pasted);
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl border-[1.5px] transition-all duration-200 outline-none"
          style={{
            background: 'var(--color-bg-input)',
            borderColor: val ? 'var(--color-primary)' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
            boxShadow: val ? '0 0 0 3px var(--color-primary-glow)' : 'none',
            fontFamily: 'var(--font-display)',
          }}
          id={`otp-input-${i}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
