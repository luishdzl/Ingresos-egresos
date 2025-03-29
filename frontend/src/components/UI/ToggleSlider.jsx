// components/UI/ToggleSlider.jsx
import { useEffect, useState } from 'react';

export const ToggleSlider = ({
  options = [],
  defaultValue = '',
  onChange
}) => {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [sliderPosition, setSliderPosition] = useState('0%');

  useEffect(() => {
    const initialIndex = options.findIndex(opt => opt.value === defaultValue);
    if (initialIndex >= 0) {
      setSliderPosition(`${(initialIndex * (100 / options.length))}%`);
    }
  }, [defaultValue, options]);

  const handleOptionClick = (value) => {
    setSelectedValue(value);
    onChange(value);
    
    const selectedIndex = options.findIndex(opt => opt.value === value);
    setSliderPosition(`${(selectedIndex * (100 / options.length))}%`);
  };

  return (
    <div className="relative w-full h-12 bg-gray-100 rounded-full p-1 shadow-inner">
      <div
        className="absolute h-10 bg-gradient-to-r from-orange-200 to-orange-300 rounded-full transition-all duration-300"
        style={{
          width: `${100 / options.length}%`,
          left: sliderPosition
        }}
      />
      
      <div className="relative flex h-full">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleOptionClick(option.value)}
            className={`flex-1 flex items-center justify-center text-sm font-medium z-5 transition-colors duration-200 ${
              selectedValue === option.value ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};