import React, { useState } from 'react';

const MultiSelect = ({ options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
  
    const toggleOption = (option) => {
      const updatedSelection = selectedOptions.includes(option)
        ? selectedOptions.filter(item => item !== option)
        : [...selectedOptions, option];
      
      setSelectedOptions(updatedSelection);
      
      // Create an object similar to the event.target from a regular select
      const pseudoEvent = {
        target: {
          selectedOptions: updatedSelection.map(value => ({ value }))
        }
      };
      onChange(pseudoEvent);
    };

    return (
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="px-2 py-2 border border-[#3dafaa] rounded inline-block bg-white text-gray-700 w-full text-left"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedOptions.length > 0 ? selectedOptions.join(' , ') : 'Select preferences'}
            </button>
          </div>
          {isOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {options.map((option) => (
                  <label key={option} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-[#3dafaa]"
                      checked={selectedOptions.includes(option)}
                      onChange={() => toggleOption(option)}
                    />
                    <span className="ml-2">{[option]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

export default MultiSelect;