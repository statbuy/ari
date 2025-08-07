import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Edit, PlusCircle } from 'lucide-react';

// Use the map image provided by the user.
const MAP_IMAGE_URL = 'https://i.postimg.cc/JhYCXr7M/image.jpg';
const STORAGE_KEY = 'interactiveMapDots';

// Helper function for a unique ID
const generateId = () => `dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Start with an empty array of dots, so the user can add them manually.
const INITIAL_DOTS = [];

// Main Application Component
export default function App() {
  const [dots, setDots] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDotId, setSelectedDotId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapRef = useRef(null);
  const dotRef = useRef(null);
  const isDragging = useRef(false);

  // Load data from local storage on component mount, or use initial dots
  useEffect(() => {
    try {
      const storedDots = localStorage.getItem(STORAGE_KEY);
      if (storedDots) {
        setDots(JSON.parse(storedDots));
      } else {
        setDots(INITIAL_DOTS);
      }
    } catch (e) {
      console.error("Could not load dots from local storage:", e);
      setDots(INITIAL_DOTS);
    }
  }, []);

  // Save data to local storage whenever dots state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dots));
    } catch (e) {
      console.error("Could not save dots to local storage:", e);
    }
  }, [dots]);

  // Handle click on the map to add a new dot in edit mode
  const handleMapClick = (e) => {
    if (!isEditMode) return;
    const map = mapRef.current;
    if (!map) return;

    const rect = map.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newDot = {
      id: generateId(),
      x,
      y,
      content: {
        title: 'New Location',
        description: 'Edit this description in the panel.',
        imageUrl: 'https://placehold.co/300x200/cccccc/000000?text=Placeholder',
      },
    };

    setDots((prevDots) => [...prevDots, newDot]);
    setSelectedDotId(newDot.id);
  };

  // Handle dot click in both modes
  const handleDotClick = (e, dotId) => {
    e.stopPropagation(); // Prevents map click event from firing
    if (isEditMode) {
      setSelectedDotId(dotId);
    } else {
      const dot = dots.find(d => d.id === dotId);
      if (dot) {
        setSelectedDotId(dotId);
        setIsModalOpen(true);
      }
    }
  };

  // Handle drag events for dots in edit mode
  const handleDragStart = (e, dotId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    isDragging.current = true;
    dotRef.current = {
      id: dotId,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    const map = mapRef.current;
    if (!map) return;
    const rect = map.getBoundingClientRect();

    const dx = e.clientX - dotRef.current.startX;
    const dy = e.clientY - dotRef.current.startY;

    setDots((prevDots) =>
      prevDots.map((dot) => {
        if (dot.id === dotRef.current.id) {
          const newX = Math.min(100, Math.max(0, dot.x + (dx / rect.width) * 100));
          const newY = Math.min(100, Math.max(0, dot.y + (dy / rect.height) * 100));
          return { ...dot, x: newX, y: newY };
        }
        return dot;
      })
    );
    dotRef.current.startX = e.clientX;
    dotRef.current.startY = e.clientY;
  };

  const handleDragEnd = () => {
    if (isDragging.current) {
      isDragging.current = false;
      dotRef.current = null;
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e, dotId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const touch = e.touches[0];
    isDragging.current = true;
    dotRef.current = {
      id: dotId,
      startX: touch.clientX,
      startY: touch.clientY,
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const map = mapRef.current;
    if (!map) return;
    const rect = map.getBoundingClientRect();

    const dx = touch.clientX - dotRef.current.startX;
    const dy = touch.clientY - dotRef.current.startY;

    setDots((prevDots) =>
      prevDots.map((dot) => {
        if (dot.id === dotRef.current.id) {
          const newX = Math.min(100, Math.max(0, dot.x + (dx / rect.width) * 100));
          const newY = Math.min(100, Math.max(0, dot.y + (dy / rect.height) * 100));
          return { ...dot, x: newX, y: newY };
        }
        return dot;
      })
    );
    dotRef.current.startX = touch.clientX;
    dotRef.current.startY = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (isDragging.current) {
      isDragging.current = false;
      dotRef.current = null;
    }
  };

  // Get the currently selected dot
  const selectedDot = dots.find((d) => d.id === selectedDotId);

  // Update dot content from the panel
  const handleContentChange = (field, value) => {
    setDots((prevDots) =>
      prevDots.map((dot) => {
        if (dot.id === selectedDotId) {
          return { ...dot, content: { ...dot.content, [field]: value } };
        }
        return dot;
      })
    );
  };

  // Delete a dot from the panel
  const handleDeleteDot = () => {
    if (selectedDotId) {
      setDots((prevDots) => prevDots.filter((d) => d.id !== selectedDotId));
      setSelectedDotId(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 p-4 font-sans text-gray-100">
      {/* Main Map Container */}
      <div className="md:flex-1 bg-gray-800 rounded-xl shadow-2xl overflow-hidden md:mr-8 mb-4 md:mb-0 relative">
        <h1 className="text-3xl font-bold text-center p-4 bg-gray-900 text-white border-b-4 border-red-500">
          המקומות האוהבים עלינו
        </h1>
        <div
          ref={mapRef}
          className="relative w-full h-auto cursor-pointer"
          onClick={handleMapClick}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img src={MAP_IMAGE_URL} alt="Map of Israel" className="w-full h-auto select-none rounded-b-xl" />

          {dots.map((dot) => (
            <div
              key={dot.id}
              className={`absolute w-4 h-4 rounded-full bg-red-600 border-2 border-white transition-transform duration-100 ease-in-out cursor-pointer ${
                isEditMode ? 'hover:scale-125' : 'hover:scale-150'
              } ${selectedDotId === dot.id ? 'z-20 scale-150 shadow-lg' : 'z-10'}`}
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => handleDotClick(e, dot.id)}
              onMouseDown={(e) => handleDragStart(e, dot.id)}
              onTouchStart={(e) => handleTouchStart(e, dot.id)}
            />
          ))}
        </div>
      </div>

      {/* Editing Panel - hidden on small screens */}
      <div className="hidden md:block md:w-80 w-full bg-gray-800 text-white rounded-xl shadow-lg p-4 flex flex-col justify-start space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Edit size={24} className="text-red-500" />
            <span>Panel</span>
          </h2>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-lg font-medium text-gray-200">Edit Mode</span>
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={() => setIsEditMode(!isEditMode)}
              className="toggle-checkbox"
            />
          </label>
          <div className="text-sm text-gray-400">
            {isEditMode
              ? 'Click on the map to add new dots. Drag existing dots to move them.'
              : 'Click on a dot to see the details.'}
          </div>
        </div>

        {selectedDot && isEditMode && (
          <div className="bg-gray-700 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-bold flex items-center space-x-2 text-red-400">
              <MapPin size={20} className="text-red-400" />
              <span>Edit Selected Location</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                value={selectedDot.content.title}
                onChange={(e) => handleContentChange('title', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-white shadow-sm focus:border-red-500 focus:ring-red-500 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={selectedDot.content.description}
                onChange={(e) => handleContentChange('description', e.target.value)}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-white shadow-sm focus:border-red-500 focus:ring-red-500 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Image URL</label>
              <input
                type="text"
                value={selectedDot.content.imageUrl}
                onChange={(e) => handleContentChange('imageUrl', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-white shadow-sm focus:border-red-500 focus:ring-red-500 p-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleDeleteDot}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Dot
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Pop-up for Content */}
      {isModalOpen && selectedDot && (
        <Portal>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-gray-800 rounded-xl shadow-xl overflow-hidden w-full max-w-md scale-up-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedDot.content.imageUrl}
                  alt={selectedDot.content.title}
                  className="w-full h-auto object-cover rounded-t-xl"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200/cccccc/000000?text=Image+Not+Found';
                    e.target.alt = 'Image Not Found';
                  }}
                />
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-2 right-2 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedDot.content.title}</h3>
                <p className="text-gray-400">{selectedDot.content.description}</p>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* A simple portal component and custom CSS */}
      {createPortal(
        <style>
          {`
          .toggle-checkbox {
            appearance: none;
            width: 3.5rem;
            height: 2rem;
            background: #4b5563; /* Tailwind gray-600 */
            border-radius: 9999px;
            position: relative;
            cursor: pointer;
            outline: none;
            transition: all 0.3s ease-in-out;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
          }
          .toggle-checkbox::after {
            content: '';
            position: absolute;
            left: 0.25rem;
            top: 0.25rem;
            width: 1.5rem;
            height: 1.5rem;
            background: white;
            border-radius: 9999px;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .toggle-checkbox:checked {
            background: #ef4444; /* Tailwind red-500 */
          }
          .toggle-checkbox:checked::after {
            transform: translateX(1.5rem);
          }
          
          @keyframes scale-in-center {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .scale-up-center {
            animation: scale-in-center 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
          }
          `}
        </style>,
        document.body
      )}
    </div>
  );
}

// Simple Portal Component
function Portal({ children }) {
  return createPortal(children, document.body);
}
