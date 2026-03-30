import { useRef, useCallback } from 'react';

/**
 * useTilt - adds a smooth 3D tilt perspective effect on mouse move.
 * Returns { ref, onMouseMove, onMouseLeave } to attach to any card element.
 */
export function useTilt(intensity = 8) {
    const ref = useRef(null);

    const onMouseMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -intensity;
        const rotateY = ((x - cx) / cx) * intensity;
        el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        el.style.transition = 'transform 0.08s ease-out';
    }, [intensity]);

    const onMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        el.style.transition = 'transform 0.5s ease-out';
    }, []);

    return { ref, onMouseMove, onMouseLeave };
}
