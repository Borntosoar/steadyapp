import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/* Reduced motion is not a nicety here.
 *
 * Vestibular sensitivity is one reason. The other is specific to this app: several of the
 * animated moments land immediately after grounding or urge surfing, when somebody may
 * still be dysregulated, and a screen that swoops is the wrong thing to hand them. Every
 * animation in this codebase has to collapse to a plain cross-fade when this returns true. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(!!v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduced(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
