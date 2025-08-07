document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map-container');
  const mapImage = document.getElementById('map-image');
  const editPanel = document.getElementById('edit-panel');
  const editModeToggle = document.getElementById('edit-mode-toggle');
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  const closeModalButton = document.getElementById('close-modal');
  const editForm = document.getElementById('edit-form');
  const deleteDotButton = document.getElementById('delete-dot');

  const STORAGE_KEY = 'interactiveMapDots';
  let dots = [];
  let isEditMode = false;
  let selectedDotId = null;
  let isDragging = false;
  let dragDot = null;

  // Load dots from local storage
  function loadDots() {
    try {
      const storedDots = localStorage.getItem(STORAGE_KEY);
      if (storedDots) {
        dots = JSON.parse(storedDots);
      }
    } catch (e) {
      console.error("Could not load dots from local storage:", e);
    }
    renderDots();
  }

  // Save dots to local storage
  function saveDots() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dots));
    } catch (e) {
      console.error("Could not save dots to local storage:", e);
    }
  }

  // Render dots on the map
  function renderDots() {
    // Clear existing dots
    const existingDots = mapContainer.querySelectorAll('.dot');
    existingDots.forEach(dot => dot.remove());

    dots.forEach(dot => {
      const dotElement = document.createElement('div');
      dotElement.className = 'dot absolute w-4 h-4 rounded-full bg-red-600 border-2 border-white transition-transform duration-100 ease-in-out cursor-pointer';
      dotElement.style.left = `${dot.x}%`;
      dotElement.style.top = `${dot.y}%`;
      dotElement.style.transform = 'translate(-50%, -50%)';
      dotElement.dataset.id = dot.id;

      dotElement.addEventListener('click', (e) => handleDotClick(e, dot.id));
      dotElement.addEventListener('mousedown', (e) => handleDragStart(e, dot.id));
      dotElement.addEventListener('touchstart', (e) => handleTouchStart(e, dot.id));

      mapContainer.appendChild(dotElement);
    });
  }

  // Handle map click
  mapContainer.addEventListener('click', (e) => {
    if (!isEditMode) return;
    const rect = mapContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newDot = {
      id: `dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      content: {
        title: 'New Location',
        description: 'Edit this description in the panel.',
        imageUrl: 'https://placehold.co/300x200/cccccc/000000?text=Placeholder',
      },
    };

    dots.push(newDot);
    saveDots();
    renderDots();
    setSelectedDot(newDot.id);
  });

  // Handle dot click
  function handleDotClick(e, dotId) {
    e.stopPropagation();
    if (isEditMode) {
      setSelectedDot(dotId);
    } else {
      const dot = dots.find(d => d.id === dotId);
      if (dot) {
        openModal(dot);
      }
    }
  }

  // Handle drag start
  function handleDragStart(e, dotId) {
    if (!isEditMode) return;
    e.stopPropagation();
    isDragging = true;
    const dot = dots.find(d => d.id === dotId);
    dragDot = {
      id: dotId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: dot.x,
      initialY: dot.y,
    };
  }

  // Handle drag move
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = mapContainer.getBoundingClientRect();
    const dx = e.clientX - dragDot.startX;
    const dy = e.clientY - dragDot.startY;
    const newX = dragDot.initialX + (dx / rect.width) * 100;
    const newY = dragDot.initialY + (dy / rect.height) * 100;

    const dot = dots.find(d => d.id === dragDot.id);
    if (dot) {
      dot.x = Math.min(100, Math.max(0, newX));
      dot.y = Math.min(100, Math.max(0, newY));
      renderDots();
    }
  });

  // Handle drag end
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      dragDot = null;
      saveDots();
    }
  });

  // Handle touch start
  function handleTouchStart(e, dotId) {
    if (!isEditMode) return;
    e.stopPropagation();
    const touch = e.touches[0];
    isDragging = true;
    const dot = dots.find(d => d.id === dotId);
    dragDot = {
      id: dotId,
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: dot.x,
      initialY: dot.y,
    };
  }

  // Handle touch move
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = mapContainer.getBoundingClientRect();
    const dx = touch.clientX - dragDot.startX;
    const dy = touch.clientY - dragDot.startY;
    const newX = dragDot.initialX + (dx / rect.width) * 100;
    const newY = dragDot.initialY + (dy / rect.height) * 100;

    const dot = dots.find(d => d.id === dragDot.id);
    if (dot) {
      dot.x = Math.min(100, Math.max(0, newX));
      dot.y = Math.min(100, Math.max(0, newY));
      renderDots();
    }
  });

  // Handle touch end
  document.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      dragDot = null;
      saveDots();
    }
  });

  // Set selected dot
  function setSelectedDot(dotId) {
    selectedDotId = dotId;
    const dot = dots.find(d => d.id === dotId);
    if (dot) {
      editForm.title.value = dot.content.title;
      editForm.description.value = dot.content.description;
      editForm.imageUrl.value = dot.content.imageUrl;
      editPanel.classList.remove('hidden');
    } else {
      editPanel.classList.add('hidden');
    }
  }

  // Handle form change
  editForm.addEventListener('input', (e) => {
    if (!selectedDotId) return;
    const dot = dots.find(d => d.id === selectedDotId);
    if (dot) {
      dot.content[e.target.name] = e.target.value;
      saveDots();
    }
  });

  // Handle delete dot
  deleteDotButton.addEventListener('click', () => {
    if (!selectedDotId) return;
    dots = dots.filter(d => d.id !== selectedDotId);
    saveDots();
    renderDots();
    setSelectedDot(null);
  });

  // Open modal
  function openModal(dot) {
    modalContent.innerHTML = `
      <div class="relative">
        <img src="${dot.content.imageUrl}" alt="${dot.content.title}" class="w-full h-auto object-cover rounded-t-xl" onerror="this.src='https://placehold.co/300x200/cccccc/000000?text=Image+Not+Found'">
        <button id="close-modal-inner" class="absolute top-2 right-2 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="p-6">
        <h3 class="text-2xl font-bold text-white mb-2">${dot.content.title}</h3>
        <p class="text-gray-400">${dot.content.description}</p>
      </div>
    `;
    modal.classList.remove('hidden');
    document.getElementById('close-modal-inner').addEventListener('click', closeModal);
  }

  // Close modal
  function closeModal() {
    modal.classList.add('hidden');
  }

  closeModalButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Toggle edit mode
  editModeToggle.addEventListener('change', (e) => {
    isEditMode = e.target.checked;
    if (!isEditMode) {
      setSelectedDot(null);
    }
  });

  // Initial load
  loadDots();
});
