import React from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    required?: boolean;
    placeholder?: string;
}

/**
 * DateInput component with iOS-friendly calendar positioning
 * The native date picker will be centered on mobile devices
 */
export const DateInput: React.FC<DateInputProps> = ({
    value,
    onChange,
    className = '',
    required = false,
    placeholder
}) => {
    return (
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`date-input-centered ${className}`}
            required={required}
            placeholder={placeholder}
        />
    );
};
