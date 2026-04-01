import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  options: UseInViewOptions = {}
) {
  const [isInView, setIsInView] = useState(false);
  const { threshold = 0.1, rootMargin = "0px" } = options;
  const hasBeenInView = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenInView.current) {
          setIsInView(true);
          hasBeenInView.current = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return isInView;
}
