import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  createDualModeStyles,
  createAccessibilityVariants,
  variants,
} from "../../utils";
import * as React from "react";

// Motion Types
export interface MotionComponentProperties {
  /** Animation type */
  animation?: "fade" | "slide" | "scale" | "rotate" | "bounce" | "shake" | "pulse" | "none";
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right" | "in" | "out";
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Animation easing function */
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier";
  /** Custom easing function */
  customEasing?: string;
  /** Whether animation loops */
  loop?: boolean;
  /** Number of loops (0 = infinite) */
  loopCount?: number;
  /** Whether animation plays on mount */
  playOnMount?: boolean;
  /** Whether animation plays on hover */
  playOnHover?: boolean;
  /** Whether animation plays on click */
  playOnClick?: boolean;
  /** Whether animation plays on scroll */
  playOnScroll?: boolean;
  /** Scroll threshold (0-1) */
  scrollThreshold?: number;
  /** Whether to reduce motion for accessibility */
  reduceMotion?: boolean;
  /** Whether to enable haptic feedback */
  enableHapticFeedback?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: MotionAnalyticsEvent) => void;
  /** Animation state change callback */
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  /** Custom class name */
  className?: string;
}

export interface MotionPreset {
  /** Preset name */
  name: string;
  /** Preset description */
  description?: string;
  /** Animation configuration */
  config: Partial<MotionComponentProperties>;
  /** Preset category */
  category?: string;
}

export interface MotionAnalyticsEvent {
  type: "animation_start" | "animation_end" | "animation_loop" | "interaction";
  payload: {
    animation?: string;
    direction?: string;
    duration?: number;
    timestamp: number;
  };
}

// Animation presets
export const motionPresets: MotionPreset[] = [
  {
    name: "Fade In",
    description: "Smooth fade in animation",
    config: { animation: "fade", direction: "in", duration: 300, easing: "ease-out" },
    category: "Entrance",
  },
  {
    name: "Fade Out",
    description: "Smooth fade out animation",
    config: { animation: "fade", direction: "out", duration: 300, easing: "ease-in" },
    category: "Exit",
  },
  {
    name: "Slide Up",
    description: "Slide in from bottom",
    config: { animation: "slide", direction: "up", duration: 400, easing: "ease-out" },
    category: "Entrance",
  },
  {
    name: "Slide Down",
    description: "Slide in from top",
    config: { animation: "slide", direction: "down", duration: 400, easing: "ease-out" },
    category: "Entrance",
  },
  {
    name: "Scale In",
    description: "Scale in from center",
    config: { animation: "scale", direction: "in", duration: 300, easing: "ease-out" },
    category: "Entrance",
  },
  {
    name: "Bounce",
    description: "Bouncy entrance animation",
    config: { animation: "bounce", direction: "in", duration: 600, easing: "ease-out" },
    category: "Attention",
  },
  {
    name: "Shake",
    description: "Shake animation for errors",
    config: { animation: "shake", direction: "left", duration: 500, easing: "ease-in-out" },
    category: "Attention",
  },
  {
    name: "Pulse",
    description: "Gentle pulse animation",
    config: { animation: "pulse", direction: "in", duration: 1000, loop: true, easing: "ease-in-out" },
    category: "Attention",
  },
];

// Styles for Motion
const motionStyles = variants({
  base: "transition-all duration-300 ease-out",
  variants: {
    animation: {
      fade: "opacity-0",
      slide: "transform translate-y-4",
      scale: "transform scale-95",
      rotate: "transform rotate-0",
      bounce: "transform scale-95",
      shake: "transform translate-x-0",
      pulse: "transform scale-100",
      none: "",
    },
    direction: {
      up: "translate-y-4",
      down: "-translate-y-4",
      left: "translate-x-4",
      right: "-translate-x-4",
      in: "",
      out: "",
    },
    playing: {
      true: "animate-in",
      false: "animate-out",
    },
  },
  defaultVariants: {
    animation: "fade",
    direction: "up",
    playing: "false",
  },
});

// Motion Component
export const Motion = createPolymorphic<"div", MotionComponentProperties>(
  ({
    as,
    animation = "fade",
    direction = "up",
    duration = 300,
    delay = 0,
    easing = "ease-out",
    customEasing,
    loop = false,
    loopCount = 0,
    playOnMount = true,
    playOnHover = false,
    playOnClick = false,
    playOnScroll = false,
    scrollThreshold = 0.5,
    reduceMotion = true,
    enableHapticFeedback = false,
    enableAnalytics = false,
    onAnalytics,
    onAnimationStart,
    onAnimationEnd,
    className,
    children,
    ...props
  }: PolymorphicProperties<"div", MotionComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);
    const [loopCounter, setLoopCounter] = React.useState(0);
    const elementRef = React.useRef<HTMLDivElement>(null);
    const animationRef = React.useRef<number>();
    const observerRef = React.useRef<IntersectionObserver>();

    // Check for reduced motion preference
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    // Get easing function
    const getEasingFunction = React.useCallback(() => {
      if (customEasing) return customEasing;
      
      const easingMap: Record<string, string> = {
        linear: "linear",
        ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
        "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)",
      };
      
      return easingMap[easing] || easingMap["ease-out"];
    }, [easing, customEasing]);

    // Play animation
    const playAnimation = React.useCallback(() => {
      if (prefersReducedMotion && reduceMotion) return;
      
      setIsPlaying(true);
      setIsVisible(true);
      
      // Analytics
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "animation_start",
          payload: { animation, direction, duration, timestamp: Date.now() },
        });
      }
      
      // Haptic feedback
      if (enableHapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(30);
      }
      
      // Animation start callback
      onAnimationStart?.();
      
      // Clear previous animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Set animation styles
      if (elementRef.current) {
        const element = elementRef.current;
        element.style.transition = `all ${duration}ms ${getEasingFunction()}`;
        element.style.transitionDelay = `${delay}ms`;
        
        // Trigger animation
        requestAnimationFrame(() => {
          element.style.opacity = "1";
          element.style.transform = "translate(0, 0) scale(1) rotate(0deg)";
        });
      }
      
      // Handle animation end
      const timeoutId = setTimeout(() => {
        setIsPlaying(false);
        
        // Analytics
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "animation_end",
            payload: { animation, direction, duration, timestamp: Date.now() },
          });
        }
        
        // Animation end callback
        onAnimationEnd?.();
        
        // Handle looping
        if (loop && (loopCount === 0 || loopCounter < loopCount - 1)) {
          setLoopCounter(prev => prev + 1);
          
          if (enableAnalytics && onAnalytics) {
            onAnalytics({
              type: "animation_loop",
              payload: { animation, direction, duration, timestamp: Date.now() },
            });
          }
          
          // Restart animation after a brief pause
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => playAnimation(), 50);
          }, 100);
        }
      }, duration + delay);
      
      return () => clearTimeout(timeoutId);
    }, [
      prefersReducedMotion,
      reduceMotion,
      enableAnalytics,
      onAnalytics,
      enableHapticFeedback,
      onAnimationStart,
      onAnimationEnd,
      animation,
      direction,
      duration,
      delay,
      getEasingFunction,
      loop,
      loopCount,
      loopCounter,
    ]);

    // Stop animation
    const stopAnimation = React.useCallback(() => {
      setIsPlaying(false);
      setIsVisible(false);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (elementRef.current) {
        const element = elementRef.current;
        element.style.transition = "";
        element.style.transitionDelay = "";
        element.style.opacity = "";
        element.style.transform = "";
      }
    }, []);

    // Handle mount animation
    React.useEffect(() => {
      if (playOnMount) {
        const timeoutId = setTimeout(() => {
          playAnimation();
        }, delay);
        
        return () => clearTimeout(timeoutId);
      }
    }, [playOnMount, playAnimation, delay]);

    // Handle hover animation
    React.useEffect(() => {
      if (!playOnHover || !elementRef.current) return;
      
      const element = elementRef.current;
      
      const handleMouseEnter = () => {
        if (!isPlaying) playAnimation();
      };
      
      const handleMouseLeave = () => {
        if (animation === "fade" && direction === "out") {
          stopAnimation();
        }
      };
      
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);
      
      return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [playOnHover, playAnimation, stopAnimation, animation, direction, isPlaying]);

    // Handle click animation
    React.useEffect(() => {
      if (!playOnClick || !elementRef.current) return;
      
      const element = elementRef.current;
      
      const handleClick = () => {
        playAnimation();
      };
      
      element.addEventListener("click", handleClick);
      
      return () => {
        element.removeEventListener("click", handleClick);
      };
    }, [playOnClick, playAnimation]);

    // Handle scroll animation
    React.useEffect(() => {
      if (!playOnScroll || !elementRef.current) return;
      
      const element = elementRef.current;
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= scrollThreshold) {
              if (!isPlaying) playAnimation();
            }
          });
        },
        { threshold: scrollThreshold }
      );
      
      observerRef.current.observe(element);
      
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [playOnScroll, playAnimation, scrollThreshold, isPlaying]);

    // Get initial styles based on animation type
    const getInitialStyles = React.useCallback(() => {
      const styles: React.CSSProperties = {
        opacity: animation === "fade" ? "0" : "1",
        transition: `all ${duration}ms ${getEasingFunction()}`,
        transitionDelay: `${delay}ms`,
      };
      
      switch (animation) {
        case "slide":
          styles.transform = direction === "up" ? "translateY(20px)" :
                           direction === "down" ? "translateY(-20px)" :
                           direction === "left" ? "translateX(20px)" :
                           direction === "right" ? "translateX(-20px)" : "translateY(20px)";
          break;
        case "scale":
          styles.transform = direction === "in" ? "scale(0.9)" : "scale(1.1)";
          break;
        case "rotate":
          styles.transform = "rotate(-5deg)";
          break;
        case "bounce":
          styles.transform = "scale(0.8)";
          break;
        case "shake":
          styles.transform = "translateX(0)";
          break;
        case "pulse":
          styles.transform = "scale(1)";
          break;
      }
      
      return styles;
    }, [animation, direction, duration, delay, getEasingFunction]);

    const Component = as || "div";

    return (
      <Component
        ref={(node) => {
          (elementRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn(
          motionStyles({ 
            animation, 
            direction, 
            playing: isPlaying ? "true" : "false" 
          }),
          className
        )}
        style={getInitialStyles()}
        {...props}
      >
        {children}
      </Component>
    );
  },
  "Motion"
);

// Motion Group Component for coordinated animations
export interface MotionGroupProperties {
  /** Children to animate */
  children: React.ReactNode;
  /** Stagger delay between children */
  staggerDelay?: number;
  /** Animation preset to apply */
  preset?: MotionPreset;
  /** Custom class name */
  className?: string;
}

export const MotionGroup = createPolymorphic<"div", MotionGroupProperties>(
  ({
    as,
    children,
    staggerDelay = 100,
    preset,
    className,
    ...props
  }: PolymorphicProperties<"div", MotionGroupProperties>, ref: PolymorphicReference<"div">) => {
    const childrenArray = React.Children.toArray(children);
    
    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn("motion-group", className)}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <Motion
            key={index}
            delay={index * staggerDelay}
            {...(preset?.config || {})}
          >
            {child}
          </Motion>
        ))}
      </Component>
    );
  },
  "MotionGroup"
);

// Export styles for external use
export const motionVariants = {
  motionStyles,
};
