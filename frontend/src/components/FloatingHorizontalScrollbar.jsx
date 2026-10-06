import { useEffect, useRef, useState } from 'react';

export default function FloatingHorizontalScrollbar({ scrollContainerRef }) {
  const scrollbarRef = useRef(null);
  const trackRef = useRef(null);
  const [position, setPosition] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    const track = trackRef.current;

    if (!container || !scrollbar || !track) return undefined;

    let animationFrame;

    const updatePosition = () => {
      const bounds = container.getBoundingClientRect();
      const left = Math.max(0, bounds.left);
      const right = Math.min(window.innerWidth, bounds.right);
      const width = Math.max(0, right - left);
      const overflows = container.scrollWidth > container.clientWidth + 1;
      const isVisible = overflows
        && window.matchMedia('(min-width: 768px)').matches
        && bounds.bottom > 0
        && bounds.top < window.innerHeight
        && width > 0;

      track.style.width = `${container.scrollWidth}px`;
      if (Math.abs(scrollbar.scrollLeft - container.scrollLeft) > 1) {
        scrollbar.scrollLeft = container.scrollLeft;
      }

      setPosition((current) => (
        current.left === left
        && current.width === width
        && current.visible === isVisible
          ? current
          : { left, width, visible: isVisible }
      ));
    };

    const schedulePositionUpdate = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updatePosition);
    };

    const syncFromTable = () => {
      if (Math.abs(scrollbar.scrollLeft - container.scrollLeft) > 1) {
        scrollbar.scrollLeft = container.scrollLeft;
      }
      schedulePositionUpdate();
    };

    const syncFromScrollbar = () => {
      if (Math.abs(container.scrollLeft - scrollbar.scrollLeft) > 1) {
        container.scrollLeft = scrollbar.scrollLeft;
      }
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(schedulePositionUpdate)
      : null;

    resizeObserver?.observe(container);
    if (container.firstElementChild) {
      resizeObserver?.observe(container.firstElementChild);
    }

    container.addEventListener('scroll', syncFromTable, { passive: true });
    scrollbar.addEventListener('scroll', syncFromScrollbar, { passive: true });
    window.addEventListener('scroll', schedulePositionUpdate, true);
    window.addEventListener('resize', schedulePositionUpdate);
    updatePosition();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      container.removeEventListener('scroll', syncFromTable);
      scrollbar.removeEventListener('scroll', syncFromScrollbar);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      window.removeEventListener('resize', schedulePositionUpdate);
    };
  }, [scrollContainerRef]);

  return (
    <div
      ref={scrollbarRef}
      className="fixed z-40 hidden md:block overflow-x-auto overflow-y-hidden rounded-full border border-slate-300 bg-white shadow-lg"
      style={{
        left: position.left,
        width: position.width,
        bottom: 8,
        height: 18,
        visibility: position.visible ? 'visible' : 'hidden',
        pointerEvents: position.visible ? 'auto' : 'none',
      }}
      role="region"
      aria-label="Desplazamiento horizontal de la tabla"
      aria-hidden={!position.visible}
      tabIndex={position.visible ? 0 : -1}
    >
      <div ref={trackRef} style={{ height: 1 }} />
    </div>
  );
}
