import { useRef, useState, useCallback } from 'react';

/**
 * useDragAndDrop — improved hook for HTML5 drag-and-drop reorderable lists.
 *
 * Fixes:
 * - Race condition: uses ref for dragOverIndex to avoid stale closure issues
 * - Drop indicator: returns dropPosition ('above' | 'below') based on cursor Y
 * - Drag ghost: applies CSS class via data-attribute
 * - Keyboard reorder: Alt+ArrowUp / Alt+ArrowDown on focused item
 *
 * @param {Array} items - Current list of items
 * @param {Function} onReorder - Callback(newItems) called after drop
 * @returns Object with drag state and getDragProps(index)
 */
export function useDragAndDrop(items, onReorder) {
  const dragIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);
  const rafRef = useRef(null);

  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState('below'); // 'above' | 'below'

  const handleDragStart = useCallback((e, index) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost: tiny delay so element doesn't vanish on drag start
    setTimeout(() => {
      if (e.target) e.target.setAttribute('data-dragging', 'true');
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (e.target) e.target.removeAttribute('data-dragging');
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDragOverIndex(null);
    setDropPosition('below');
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragIndexRef.current === null || dragIndexRef.current === index) return;

    // Throttle via rAF to prevent race conditions
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? 'above' : 'below';

      if (dragOverIndexRef.current !== index || dropPosition !== pos) {
        dragOverIndexRef.current = index;
        setDragOverIndex(index);
        setDropPosition(pos);
      }
    });
  }, [dropPosition]);

  const handleDrop = useCallback((e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      dragIndexRef.current = null;
      dragOverIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [dragged] = newItems.splice(from, 1);
    // Insert above or below target depending on drop position
    const insertAt = dropPosition === 'above' ? index : index;
    newItems.splice(insertAt, 0, dragged);

    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
    setDropPosition('below');
    onReorder(newItems);
  }, [items, onReorder, dropPosition]);

  const handleDragLeave = useCallback((e) => {
    // Only clear if leaving the container (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dragOverIndexRef.current = null;
      setDragOverIndex(null);
    }
  }, []);

  /**
   * Keyboard reorder handler — attach to the container element.
   * Alt+ArrowUp moves focused item up, Alt+ArrowDown moves it down.
   */
  const getKeyboardProps = useCallback((index) => ({
    tabIndex: 0,
    onKeyDown: (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        const newItems = [...items];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index - 1, 0, item);
        onReorder(newItems);
      }
      if (e.key === 'ArrowDown' && index < items.length - 1) {
        e.preventDefault();
        const newItems = [...items];
        const [item] = newItems.splice(index, 1);
        newItems.splice(index + 1, 0, item);
        onReorder(newItems);
      }
    },
  }), [items, onReorder]);

  return {
    dragOverIndex,
    dropPosition,
    isDragging: dragIndexRef.current !== null,
    getDragProps: (index) => ({
      draggable: true,
      onDragStart: (e) => handleDragStart(e, index),
      onDragEnd: handleDragEnd,
      onDragOver: (e) => handleDragOver(e, index),
      onDrop: (e) => handleDrop(e, index),
      onDragLeave: handleDragLeave,
    }),
    getKeyboardProps,
  };
}
