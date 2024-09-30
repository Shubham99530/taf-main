import React from 'react';

const PreviewModal = ({ isOpen, onClose, data, courseTitle, allocated, currentRound }) => {
  if (!isOpen || data.length === 0) return null;

  const headers = Object.keys(data[0] || {});

  const renderCellContent = (content) => {
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content);
    }
    return content;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-2">{`${courseTitle} ${allocated ? "Allocated" : "Available"} Students Preview`}</h2>
        <h3 className="text-xl mb-4">Current Round: {currentRound}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header) => (
                  <th key={header} className="border border-gray-300 p-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={header} className="border border-gray-300 p-2">
                      {renderCellContent(row[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;