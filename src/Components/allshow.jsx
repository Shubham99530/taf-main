// import React from 'react';

// const AllCoursesPreviewModal = ({ isOpen, onClose, coursesData, currentRound }) => {
//   if (!isOpen || !coursesData || Object.keys(coursesData).length === 0) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//       <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
//         <h2 className="text-2xl font-bold mb-2">All Courses Allocation Preview</h2>
//         <h3 className="text-xl mb-4">Current Round: {currentRound}</h3>
        
//         {Object.entries(coursesData).map(([courseTitle, courseData]) => (
//           <div key={courseTitle} className="mb-8">
//             <h4 className="text-lg font-semibold mb-2">{courseTitle}</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse border border-gray-300">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     {Object.keys(courseData.allocated[0] || {}).map((header) => (
//                       <th key={header} className="border border-gray-300 p-2">{header}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {courseData.allocated.map((student, index) => (
//                     <tr key={index}>
//                       {Object.entries(student).map(([key, value]) => (
//                         <td key={key} className="border border-gray-300 p-2">
//                           {typeof value === 'object' ? JSON.stringify(value) : value}
//                         </td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         ))}
        
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={onClose}
//             className="bg-red-500 text-white px-4 py-2 rounded mr-2"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AllCoursesPreviewModal;

import { useNavigate } from "react-router-dom";
import React from 'react';

const AllCoursesPreviewModal = ({ isOpen, onClose, currentRound }) => {
    const API = import.meta.env.VITE_API_URL;

    const coursesData= fetch(`${API}/api/al/getAllAllocation`);


  if (!isOpen || !coursesData || Object.keys(coursesData).length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-2">All Courses Allocation Preview</h2>
        <h3 className="text-xl mb-4">Current Round: {currentRound}</h3>
        
        {Object.entries(coursesData).map(([courseTitle, courseData]) => {
          if (!courseData || !courseData.allocated || courseData.allocated.length === 0) {
            return (
              <div key={courseTitle} className="mb-8">
                <h4 className="text-lg font-semibold mb-2">{courseTitle}</h4>
                <p>No allocation data available for this course.</p>
              </div>
            );
          }

          const headers = Object.keys(courseData.allocated[0]);
          

          return (
            <div key={courseTitle} className="mb-8">
              <h4 className="text-lg font-semibold mb-2">{courseTitle}</h4>
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
                    {courseData.allocated.map((student, index) => (
                      <tr key={index}>
                        {headers.map((header) => (
                          <td key={header} className="border border-gray-300 p-2">
                            {typeof student[header] === 'object' 
                              ? JSON.stringify(student[header]) 
                              : student[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        
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

export default AllCoursesPreviewModal;