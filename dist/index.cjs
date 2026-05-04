"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ActorImage: () => ActorImage_default,
  BlurredBackground: () => BlurredBackground_default,
  NovelVisualizer: () => NovelVisualizer_default,
  TypeOut: () => TypeOut_default,
  defaultInlineClassStyles: () => defaultInlineClassStyles,
  formatInlineStyles: () => formatInlineStyles
});
module.exports = __toCommonJS(index_exports);

// src/components/NovelVisualizer.tsx
var import_react5 = __toESM(require("react"), 1);
var import_material = require("@mui/material");
var import_styles2 = require("@mui/material/styles");
var import_icons_material = require("@mui/icons-material");
var import_framer_motion2 = require("framer-motion");

// src/components/ActorImage.tsx
var import_framer_motion = require("framer-motion");
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var IDLE_HEIGHT = 80;
var SPEAKING_HEIGHT = 85;
var ActorImage = ({
  id,
  resolveImageUrl,
  xPosition,
  yPosition,
  zIndex,
  heightMultiplier,
  speaker,
  highlightColor,
  onMouseEnter,
  onMouseLeave,
  popInSide = "none",
  isAudioPlaying = false
}) => {
  const [isLoaded, setIsLoaded] = (0, import_react.useState)(false);
  const [displayedImageUrl, setDisplayedImageUrl] = (0, import_react.useState)("");
  const [aspectRatio, setAspectRatio] = (0, import_react.useState)("9 / 16");
  const imageUrl = resolveImageUrl();
  (0, import_react.useEffect)(() => {
    if (!imageUrl) {
      setIsLoaded(false);
      setDisplayedImageUrl("");
      return;
    }
    if (imageUrl === displayedImageUrl && isLoaded) {
      return;
    }
    let isCancelled = false;
    const img = new Image();
    img.onload = () => {
      if (isCancelled) {
        return;
      }
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      }
      setDisplayedImageUrl(imageUrl);
      setIsLoaded(true);
    };
    img.src = imageUrl;
    return () => {
      isCancelled = true;
    };
  }, [displayedImageUrl, imageUrl, isLoaded]);
  const baseX = speaker ? 50 : xPosition;
  const baseY = yPosition;
  const variants = (0, import_react.useMemo)(() => {
    if (popInSide !== "none") {
      const popInX = popInSide === "left" ? 10 : 90;
      const offscreenX = popInSide === "left" ? -20 : 120;
      const tiltRotate = popInSide === "left" ? 15 : -15;
      return {
        absent: {
          opacity: 0,
          x: `${offscreenX}vw`,
          bottom: `${baseY}vh`,
          height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.7)",
          rotate: tiltRotate * 1.5,
          transition: {
            x: { ease: import_framer_motion.easeIn, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { duration: 0.5, ease: "easeInOut" },
            rotate: { duration: 0.4 }
          }
        },
        talking: {
          opacity: 0.85,
          x: `${popInX}vw`,
          bottom: `${baseY}vh`,
          height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.9)",
          rotate: tiltRotate,
          transition: {
            x: { ease: import_framer_motion.easeOut, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { ease: import_framer_motion.easeOut, duration: 0.4 },
            rotate: { duration: 0.4 }
          }
        },
        idle: {
          opacity: 0.85,
          x: `${popInX}vw`,
          bottom: `${baseY}vh`,
          height: `${IDLE_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.7)",
          rotate: tiltRotate,
          transition: {
            x: { ease: import_framer_motion.easeOut, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { ease: import_framer_motion.easeOut, duration: 0.4 },
            rotate: { duration: 0.4 }
          }
        }
      };
    }
    return {
      absent: {
        opacity: 0,
        x: `150vw`,
        bottom: `${baseY}vh`,
        height: `${IDLE_HEIGHT * heightMultiplier}vh`,
        filter: "brightness(0.8)",
        transition: { x: { ease: import_framer_motion.easeIn, duration: 0.5 }, bottom: { duration: 0.5 }, opacity: { ease: import_framer_motion.easeOut, duration: 0.5 } }
      },
      talking: {
        opacity: 1,
        x: `${baseX}vw`,
        bottom: `${baseY}vh`,
        height: `${SPEAKING_HEIGHT * heightMultiplier}vh`,
        filter: "brightness(1)",
        transition: { x: { ease: import_framer_motion.easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: import_framer_motion.easeOut, duration: 0.3 } }
      },
      idle: {
        opacity: 1,
        x: `${baseX}vw`,
        bottom: `${baseY}vh`,
        height: `${IDLE_HEIGHT * heightMultiplier}vh`,
        filter: "brightness(0.8)",
        transition: { x: { ease: import_framer_motion.easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: import_framer_motion.easeOut, duration: 0.3 } }
      }
    };
  }, [baseX, baseY, yPosition, zIndex, heightMultiplier, popInSide]);
  const [animationParams, setAnimationParams] = (0, import_react.useState)(() => {
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random1 = Math.abs(Math.sin(seed) * 1e4 % 1);
    const random2 = Math.abs(Math.sin(seed + 1) * 1e4 % 1);
    const squish = 0.995 + random1 * 4e-3;
    const stretch = 1.005 - random2 * 4e-3;
    const duration = 0.2 + random1 * 0.4;
    return { squish, stretch, duration };
  });
  (0, import_react.useEffect)(() => {
    if (!isAudioPlaying || !speaker) {
      return;
    }
    const updateInterval = 1e3 + Math.random() * 2e3;
    const intervalId = setInterval(() => {
      setAnimationParams((prev) => {
        const random1 = Math.random();
        const random2 = Math.random();
        const random3 = Math.random();
        const squish = 0.992 + random1 * 6e-3;
        const stretch = 1.002 + random2 * 6e-3;
        const duration = 0.15 + random3 * 0.55;
        return { squish, stretch, duration };
      });
    }, updateInterval);
    return () => clearInterval(intervalId);
  }, [isAudioPlaying, speaker]);
  const popInMaskStyle = popInSide !== "none" ? {
    maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)"
  } : {};
  const animateProps = (0, import_react.useMemo)(() => {
    if (speaker && isAudioPlaying) {
      const talkingVariant = variants.talking;
      const baseTransition = popInSide !== "none" ? { x: { ease: import_framer_motion.easeOut, duration: 0.4 }, bottom: { duration: 0.4 }, opacity: { ease: import_framer_motion.easeOut, duration: 0.4 }, rotate: { duration: 0.4 } } : { x: { ease: import_framer_motion.easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: import_framer_motion.easeOut, duration: 0.3 } };
      return {
        ...talkingVariant,
        scaleY: [1, animationParams.squish, animationParams.stretch, 1],
        transition: {
          ...baseTransition,
          scaleY: {
            duration: animationParams.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      };
    }
    return speaker ? "talking" : "idle";
  }, [speaker, isAudioPlaying, variants, popInSide, animationParams]);
  const filterId = `tint-${id}`;
  return displayedImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { style: { position: "absolute", width: 0, height: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("filter", { id: filterId, x: "0%", y: "0%", width: "100%", height: "100%", colorInterpolationFilters: "sRGB", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feFlood", { floodColor: highlightColor, result: "flood" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feComposite", { in: "flood", in2: "SourceGraphic", operator: "in", result: "masked" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feBlend", { in: "SourceGraphic", in2: "masked", mode: "multiply" })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_framer_motion.motion.div,
      {
        variants,
        initial: "absent",
        exit: "absent",
        animate: animateProps,
        transformTemplate: (_, generatedTransform) => {
          const baseTransform = generatedTransform?.trim() || "";
          return baseTransform ? `${baseTransform} translateX(-50%)` : "translateX(-50%)";
        },
        style: { position: "absolute", width: "auto", aspectRatio, overflow: "visible", zIndex: speaker ? 100 : zIndex, transformOrigin: "bottom center" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_framer_motion.AnimatePresence, { children: displayedImageUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_framer_motion.motion.img,
            {
              src: displayedImageUrl,
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: { duration: 0.5 },
              style: {
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                filter: `url(#${filterId}) blur(2.5px)`,
                zIndex: 4,
                pointerEvents: "none",
                ...popInMaskStyle
              }
            },
            `${id}_${displayedImageUrl}_bg`
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_framer_motion.AnimatePresence, { children: displayedImageUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_framer_motion.motion.img,
            {
              src: displayedImageUrl,
              initial: { opacity: 0 },
              animate: { opacity: 0.75 },
              exit: { opacity: 0 },
              transition: { duration: 0.5 },
              style: {
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                filter: `url(#${filterId})`,
                zIndex: 5,
                ...popInMaskStyle
              },
              onMouseEnter,
              onMouseLeave
            },
            `${id}_${displayedImageUrl}_main`
          ) })
        ]
      },
      `actor_motion_div_${id}`
    )
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {});
};
var ActorImage_default = (0, import_react.memo)(ActorImage);

// src/components/BlurredBackground.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var BlurredBackground = ({
  imageUrl,
  brightness = 0.6,
  contrast = 1.05,
  blur = 6,
  scale = 1.03,
  overlay,
  transitionDuration = 600,
  children
}) => {
  const [currentImage, setCurrentImage] = (0, import_react2.useState)(imageUrl);
  const [previousImage, setPreviousImage] = (0, import_react2.useState)();
  const [incomingImage, setIncomingImage] = (0, import_react2.useState)();
  const [isTransitioning, setIsTransitioning] = (0, import_react2.useState)(false);
  const [isFadeActive, setIsFadeActive] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (imageUrl !== currentImage) {
      setPreviousImage(currentImage);
      setIncomingImage(imageUrl);
      setIsTransitioning(true);
      setIsFadeActive(false);
      const rafId = requestAnimationFrame(() => {
        setIsFadeActive(true);
      });
      const timer = setTimeout(() => {
        setCurrentImage(imageUrl);
        setIsTransitioning(false);
        setIsFadeActive(false);
        setPreviousImage(void 0);
        setIncomingImage(void 0);
      }, transitionDuration);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    }
  }, [imageUrl, currentImage, transitionDuration]);
  const imageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
    transform: `scale(${scale})`,
    transition: `opacity ${transitionDuration}ms ease-in-out`
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden"
  }, children: [
    isTransitioning && previousImage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
      ...imageStyle,
      backgroundImage: `url(${previousImage})`,
      opacity: isFadeActive ? 0 : 1,
      zIndex: 0
    } }),
    isTransitioning ? incomingImage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
      ...imageStyle,
      backgroundImage: `url(${incomingImage})`,
      opacity: isFadeActive ? 1 : 0,
      zIndex: 1
    } }) : currentImage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
      ...imageStyle,
      backgroundImage: `url(${currentImage})`,
      opacity: 1,
      zIndex: 0
    } }),
    overlay && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: overlay,
      zIndex: 1
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      height: "100%"
    }, children })
  ] });
};
var BlurredBackground_default = BlurredBackground;

// src/components/TypeOut.tsx
var import_react3 = __toESM(require("react"), 1);
var import_jsx_runtime3 = require("react/jsx-runtime");
var extractTextContent = (node) => {
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (import_react3.default.isValidElement(node)) {
    if (node.props.children) {
      return extractTextContent(node.props.children);
    }
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }
  return "";
};
var truncateReactContent = (node, maxLength) => {
  let currentLength = 0;
  const truncateNode = (n, key) => {
    if (currentLength >= maxLength) {
      return null;
    }
    if (typeof n === "string") {
      const remaining = maxLength - currentLength;
      const truncated = n.slice(0, remaining);
      currentLength += truncated.length;
      return truncated;
    }
    if (typeof n === "number") {
      const str = String(n);
      const remaining = maxLength - currentLength;
      const truncated = str.slice(0, remaining);
      currentLength += truncated.length;
      return truncated;
    }
    if (import_react3.default.isValidElement(n)) {
      const children = n.props.children;
      if (children !== void 0 && children !== null) {
        const truncatedChildren = truncateNode(children);
        if (truncatedChildren !== null || !children) {
          return import_react3.default.cloneElement(n, { ...n.props, key }, truncatedChildren);
        }
        return null;
      }
      return import_react3.default.cloneElement(n, { ...n.props, key });
    }
    if (Array.isArray(n)) {
      const result = [];
      for (let i = 0; i < n.length; i++) {
        if (currentLength >= maxLength) break;
        const child = n[i];
        const truncated = truncateNode(child, i);
        if (truncated !== null && truncated !== void 0) {
          result.push(truncated);
        }
      }
      return result.length > 0 ? result : null;
    }
    return n;
  };
  return truncateNode(node);
};
var TypeOut = ({
  children,
  speed = 25,
  className,
  finishTyping = false,
  onTypingComplete
}) => {
  const [displayLength, setDisplayLength] = import_react3.default.useState(0);
  const [finished, setFinished] = import_react3.default.useState(false);
  const timerRef = import_react3.default.useRef(null);
  const textContent = import_react3.default.useMemo(() => extractTextContent(children), [children]);
  const prevTextContentRef = import_react3.default.useRef("");
  const onTypingCompleteRef = import_react3.default.useRef(onTypingComplete);
  import_react3.default.useEffect(() => {
    onTypingCompleteRef.current = onTypingComplete;
  }, [onTypingComplete]);
  import_react3.default.useEffect(() => {
    if (textContent !== prevTextContentRef.current) {
      prevTextContentRef.current = textContent;
      setDisplayLength(0);
      setFinished(false);
      if (!textContent) {
        setFinished(true);
        onTypingCompleteRef.current?.();
        return;
      }
      const idxRef = { current: 0 };
      timerRef.current = window.setInterval(() => {
        idxRef.current += 1;
        setDisplayLength(idxRef.current);
        if (idxRef.current >= textContent.length) {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setFinished(true);
          onTypingCompleteRef.current?.();
        }
      }, speed);
      return () => {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [textContent, speed]);
  import_react3.default.useEffect(() => {
    if (finishTyping && !finished) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDisplayLength(textContent.length);
      setFinished(true);
      onTypingCompleteRef.current?.();
    }
  }, [finishTyping, finished, textContent.length]);
  const displayContent = import_react3.default.useMemo(() => {
    if (displayLength === 0) {
      return null;
    }
    if (finished || finishTyping && displayLength >= textContent.length) {
      return children;
    }
    return truncateReactContent(children, displayLength);
  }, [children, displayLength, finished, finishTyping, textContent.length]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "span",
    {
      className,
      style: { userSelect: "none" },
      "aria-label": "message",
      children: displayContent
    }
  );
};
var TypeOut_default = TypeOut;

// src/utils/TextFormatting.tsx
var import_react4 = __toESM(require("react"), 1);
var import_styles = require("@mui/material/styles");
var import_jsx_runtime4 = require("react/jsx-runtime");
var INLINE_STYLE_SHEET_ID = "novel-visualizer-inline-style-presets";
var INLINE_STYLE_PRESET_CSS = `
@keyframes nvInlineShinyPulse {
    0%, 68%, 100% {
        filter: brightness(1) saturate(1);
        text-shadow: inherit;
    }
    72% {
        filter: brightness(1.28) saturate(1.22);
        text-shadow: 0 0 5px currentColor, 0 0 14px rgba(255, 255, 255, 0.9);
    }
    76% {
        filter: brightness(1.1) saturate(1.08);
        text-shadow: 0 0 3px currentColor, 0 0 9px rgba(255, 255, 255, 0.55);
    }
}

@keyframes nvInlineSpookyWave {
    0%, 100% {
        transform: translateY(0px);
    }
    25% {
        transform: translateY(-2px);
    }
    75% {
        transform: translateY(2px);
    }
}

@keyframes nvInlineQuake {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }
    25% {
        transform: translate(-0.45px, 0.45px) rotate(-0.2deg);
    }
    50% {
        transform: translate(0.4px, -0.4px) rotate(0.2deg);
    }
    75% {
        transform: translate(-0.35px, -0.45px) rotate(-0.15deg);
    }
    100% {
        transform: translate(0.35px, 0.25px) rotate(0.15deg);
    }
}

@keyframes nvInlineGlitch {
    0%, 100% {
        filter: saturate(1.08) contrast(1);
    }
    40% {
        filter: saturate(1.2) contrast(1.08);
    }
    70% {
        filter: saturate(1.12) contrast(1.12);
    }
}

@keyframes nvInlineGlitchChar {
    0%, 100% {
        transform: translate3d(0, 0, 0);
        text-shadow: inherit;
    }
    14% {
        transform: translate3d(-0.6px, 0, 0);
        text-shadow: -1px 0 rgba(255, 0, 92, 0.9), 1px 0 rgba(0, 229, 255, 0.9);
    }
    16% {
        transform: translate3d(0.55px, 0, 0);
        text-shadow: 1px 0 rgba(255, 0, 92, 0.8), -1px 0 rgba(0, 229, 255, 0.8);
    }
    60% {
        transform: translate3d(0, -0.45px, 0);
        text-shadow: -1px 0 rgba(255, 0, 92, 0.62), 1px 0 rgba(0, 229, 255, 0.62);
    }
}

@keyframes nvInlineZalgo {
    0%, 100% {
        filter: brightness(0.98) saturate(0.86);
        text-shadow: inherit;
    }
    50% {
        filter: brightness(1.08) saturate(0.72);
        text-shadow: 0 -1px 0 rgba(255, 255, 255, 0.35), 0 0 7px currentColor, 0 0 14px rgba(145, 255, 210, 0.28);
    }
}

@keyframes nvInlineZalgoChar {
    0%,
    100% {
        transform: translate3d(0, 0, 0) skewX(0deg);
    }
    30% {
        transform: translate3d(-0.5px, -0.35px, 0) skewX(-1.5deg);
    }
    65% {
        transform: translate3d(0.45px, 0.25px, 0) skewX(1.2deg);
    }
}

@keyframes nvInlineShout {
    0%, 100% {
        filter: brightness(1.14) saturate(1.14);
    }
}

@keyframes nvInlineFlutter {
    0%, 100% {
        opacity: 0.95;
        filter: saturate(1);
    }
    35% {
        opacity: 0.86;
        filter: saturate(1.08) hue-rotate(-7deg);
    }
    65% {
        opacity: 0.9;
        filter: saturate(1.02) hue-rotate(6deg);
    }
}

@keyframes nvInlineFlutterChar {
    0%, 100% {
        transform: translate3d(0, 0, 0);
    }
    25% {
        transform: translate3d(-0.7px, 0, 0);
    }
    50% {
        transform: translate3d(0.7px, 0, 0);
    }
    75% {
        transform: translate3d(-0.35px, 0, 0);
    }
}

@keyframes nvInlineSigh {
    0%, 100% {
        opacity: 0.78;
        filter: blur(0px) saturate(0.94);
    }
    55% {
        opacity: 0.62;
        filter: blur(0.35px) saturate(0.74);
    }
}

@keyframes nvInlineSighChar {
    0% {
        transform: scaleY(1);
    }
    70% {
        transform: scaleY(1.18);
    }
    100% {
        transform: scaleY(1.08);
    }
}

@keyframes nvInlineBurning {
    0%, 100% {
        filter: brightness(1) saturate(1.2);
        text-shadow: inherit;
    }
    40% {
        filter: brightness(1.12) saturate(1.38);
        text-shadow: 0 0 3px rgba(255, 190, 92, 0.95), 0 -1px 8px rgba(255, 98, 0, 0.76), 0 -2px 15px rgba(255, 44, 0, 0.45);
    }
    70% {
        filter: brightness(0.98) saturate(1.28);
        text-shadow: 0 0 2px rgba(255, 205, 120, 0.85), 0 -1px 6px rgba(255, 140, 0, 0.6), 0 -2px 11px rgba(255, 68, 0, 0.38);
    }
}

@keyframes nvInlineSparkRise {
    0% {
        transform: translate3d(0, 0, 0) scale(0.72);
        opacity: 0;
    }
    18% {
        opacity: 0.95;
    }
    100% {
        transform: translate3d(var(--nv-spark-x-drift, 0px), -1.25em, 0) scale(0.25);
        opacity: 0;
    }
}

@keyframes nvInlineSparkGlow {
    0%,
    100% {
        filter: brightness(0.92) saturate(1);
    }
    50% {
        filter: brightness(1.35) saturate(1.14);
    }
}

.nv-inline-burning {
    position: relative;
    display: inline-block;
    overflow: visible;
}

.nv-inline-burning-text {
    position: relative;
    z-index: 2;
}

.nv-inline-burning-sparks {
    position: absolute;
    left: 0;
    right: 0;
    top: -0.05em;
    bottom: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 1;
}

.nv-inline-spark {
    position: absolute;
    bottom: 0.1em;
    width: 0.24em;
    height: 0.24em;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 246, 178, 0.95) 0%, rgba(255, 204, 86, 0.9) 50%, rgba(255, 146, 0, 0) 74%);
    box-shadow: 0 0 7px rgba(255, 208, 95, 0.65);
    opacity: 0;
    animation:
        nvInlineSparkRise var(--nv-spark-duration, 1.2s) linear infinite,
        nvInlineSparkGlow 1.1s ease-in-out infinite;
    animation-delay: var(--nv-spark-delay, 0ms);
    will-change: transform, opacity;
}
`;
var mergeTextShadows = (...shadows) => {
  const resolvedShadows = shadows.filter((shadow) => Boolean(shadow));
  return resolvedShadows.length > 0 ? resolvedShadows.join(", ") : void 0;
};
var ensureInlineStyleSheet = () => {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(INLINE_STYLE_SHEET_ID)) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.id = INLINE_STYLE_SHEET_ID;
  styleElement.textContent = INLINE_STYLE_PRESET_CSS;
  document.head.appendChild(styleElement);
};
var defaultInlineClassStyles = {
  // horizontal shearing or color channel offsets or other effects to randomly manipulate or offset characters
  glitch: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    animation: "nvInlineGlitch 1.35s steps(2, end) infinite",
    textShadow: mergeTextShadows(
      baseTextShadow,
      "-1px 0 rgba(255, 0, 92, 0.9)",
      "1px 0 rgba(0, 229, 255, 0.9)"
    ),
    filter: "saturate(1.18) contrast(1.06)"
  }),
  // Add random zalgo diacritics and maybe a bit of a sinister glow effect and slight vibration
  zalgo: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    fontWeight: 600,
    letterSpacing: "0.08em",
    animation: "nvInlineZalgo 1.7s steps(3, end) infinite",
    textShadow: mergeTextShadows(
      baseTextShadow,
      "0 -1px 0 rgba(255, 255, 255, 0.35)",
      "0 0 8px currentColor",
      "0 0 14px rgba(145, 255, 210, 0.28)"
    ),
    filter: "brightness(0.96) saturate(0.82)"
  }),
  // Give text a bold, impactful style with a strong outline (maybe an overshot scaled shadow or other effect to make it feel like it's popping off the page) and maybe a slight shake or pulse.
  shout: ({ baseColor }) => ({
    color: baseColor,
    fontWeight: 900,
    fontSize: "1.1em",
    textTransform: "uppercase",
    filter: "brightness(1.14) saturate(1.16)",
    textShadow: "0 0 2px currentColor, 0 3px 0 rgba(0, 0, 0, 0.4), 0 0 14px currentColor, 0 0 22px rgba(255, 255, 255, 0.2)",
    WebkitTextStroke: "0.6px rgba(0, 0, 0, 0.45)"
  }),
  // Make text appear to flutter or wobble horizontally, possibly with a subtle color shift or shadow effect, for flustered or embarrassed dialogue
  flutter: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    fontStyle: "italic",
    animation: "nvInlineFlutter 1.8s ease-in-out infinite",
    textShadow: mergeTextShadows(
      baseTextShadow,
      "0 0 5px rgba(255, 255, 255, 0.24)"
    )
  }),
  // Text drifts downward slightly, or elongates vertically, maybe with a subtle blur or shadow effect, to evoke a sense of sadness, exhaustion, or resignation
  sigh: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    fontStyle: "italic",
    opacity: 0.78,
    animation: "nvInlineSigh 2.4s ease-out 1 both",
    textShadow: mergeTextShadows(
      baseTextShadow,
      "0 1px 2px rgba(0, 0, 0, 0.22)"
    ),
    filter: "saturate(0.88)"
  }),
  // Characters appear to smolder or burn, with a flickering effect and maybe some ember-like particles or a smoky shadow, for intense or destructive emotions
  burning: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    fontWeight: 700,
    animation: "nvInlineBurning 1.45s steps(3, end) infinite",
    textShadow: mergeTextShadows(
      baseTextShadow,
      "0 0 3px rgba(255, 190, 92, 0.95)",
      "0 -1px 8px rgba(255, 98, 0, 0.76)",
      "0 -2px 15px rgba(255, 44, 0, 0.45)"
    ),
    filter: "saturate(1.32) contrast(1.04)"
  }),
  // Make text appear shiny or reflective, possibly with a pulsing effect
  shiny: ({ baseColor }) => ({
    color: baseColor,
    fontWeight: 700,
    animation: "nvInlineShinyPulse 5.2s ease-in-out infinite",
    textShadow: "0 0 4px currentColor, 0 0 11px rgba(255, 255, 255, 0.58)",
    filter: "saturate(1.15)"
  }),
  spooky: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    letterSpacing: "0.06em",
    fontStyle: "italic",
    animation: "nvInlineSpookyWave 2.4s ease-in-out infinite",
    textShadow: baseTextShadow ? `${baseTextShadow}, 0 0 8px currentColor` : "0 0 8px currentColor"
  }),
  quake: ({ baseColor, baseTextShadow }) => ({
    color: baseColor,
    animation: "nvInlineQuake 95ms steps(2, end) infinite",
    textShadow: baseTextShadow ? `${baseTextShadow}, 0 0 2px currentColor` : "0 0 2px currentColor"
  }),
  whisper: ({ baseColor, baseTextShadow, baseFontFamily }) => ({
    color: baseColor,
    fontFamily: baseFontFamily,
    letterSpacing: "0.05em",
    fontSize: "0.92em",
    opacity: 0.85,
    textShadow: baseTextShadow
  })
};
var CLASS_TAG_PATTERN = /\[([a-zA-Z0-9_-]*)\]/g;
var resolveEndingInlineClass = (sourceText, initialActiveClass = null) => {
  let activeClass = initialActiveClass;
  let match;
  const tagPattern = new RegExp(CLASS_TAG_PATTERN.source, "g");
  while ((match = tagPattern.exec(sourceText)) !== null) {
    const [, tagName] = match;
    activeClass = tagName === "" ? null : tagName;
  }
  return activeClass;
};
var resolveClassStyles = (options) => {
  if (options?.includeDefaultClassStyles === false) {
    return { ...options.classStyles ?? {} };
  }
  return {
    ...defaultInlineClassStyles,
    ...options?.classStyles ?? {}
  };
};
var getResolvedClassStyle = (classStyle, styleContext) => {
  if (!classStyle) return void 0;
  if (typeof classStyle === "function") {
    return classStyle(styleContext);
  }
  return classStyle;
};
var ZALGO_ABOVE_DIACRITICS = [
  "\u0300",
  "\u0301",
  "\u0302",
  "\u0303",
  "\u0304",
  "\u0305",
  "\u0306",
  "\u0307",
  "\u0308",
  "\u0309",
  "\u030A",
  "\u030B",
  "\u030C",
  "\u030D",
  "\u030E",
  "\u030F",
  "\u0310",
  "\u0311",
  "\u0312",
  "\u0313",
  "\u0314",
  "\u033D",
  "\u0342",
  "\u0346"
];
var ZALGO_BELOW_DIACRITICS = [
  "\u0316",
  "\u0317",
  "\u0318",
  "\u0319",
  "\u031A",
  "\u031B",
  "\u031C",
  "\u031D",
  "\u031E",
  "\u031F",
  "\u0320",
  "\u0321",
  "\u0322",
  "\u0323",
  "\u0324",
  "\u0325",
  "\u0326",
  "\u0327",
  "\u0328",
  "\u0329",
  "\u032A",
  "\u032B",
  "\u032C",
  "\u032D",
  "\u032E",
  "\u032F",
  "\u0330",
  "\u0331",
  "\u0332",
  "\u0333"
];
var PER_CHARACTER_INLINE_CLASSES = /* @__PURE__ */ new Set(["glitch", "flutter", "sigh", "zalgo"]);
var MARKDOWN_INLINE_PATTERN = /(\*\*[^*]+\*\*|\*(?!\*)[^*]+\*|_[^_]+_|~~[^~]+~~|__[^_]+__|~[^~]+~|#{1,6} [^\n]+)/;
var BURNING_SPARK_HORIZONTAL_OFFSETS = [8, 22, 36, 51, 68, 84];
var BURNING_SPARK_X_DRIFTS = [-2.5, 1.5, -1, 2.2, -1.8, 1.2];
var getBurningSparkStyle = (sparkIndex) => {
  const durationMs = 980 + sparkIndex * 170 % 420;
  const delayMs = -(sparkIndex * 230 % 1100);
  const cssVars = {
    "--nv-spark-duration": `${durationMs}ms`,
    "--nv-spark-delay": `${delayMs}ms`,
    "--nv-spark-x-drift": `${BURNING_SPARK_X_DRIFTS[sparkIndex % BURNING_SPARK_X_DRIFTS.length]}px`
  };
  return {
    ...cssVars,
    left: `${BURNING_SPARK_HORIZONTAL_OFFSETS[sparkIndex % BURNING_SPARK_HORIZONTAL_OFFSETS.length]}%`
  };
};
var pickDeterministicMark = (source, seed) => {
  return source[Math.abs(seed) % source.length];
};
var toZalgoCharacter = (character, characterIndex) => {
  if (/\s/.test(character)) {
    return character;
  }
  const codePoint = character.codePointAt(0) ?? 0;
  const baseSeed = codePoint * 131 + characterIndex * 71;
  const aboveCount = 2 + Math.abs(baseSeed) % 2;
  const belowCount = 1 + Math.abs(baseSeed + 17) % 2;
  let transformed = character;
  for (let i = 0; i < aboveCount; i += 1) {
    transformed += pickDeterministicMark(ZALGO_ABOVE_DIACRITICS, baseSeed + i * 11);
  }
  for (let i = 0; i < belowCount; i += 1) {
    transformed += pickDeterministicMark(ZALGO_BELOW_DIACRITICS, baseSeed + i * 13 + 29);
  }
  return transformed;
};
var getPerCharacterStyle = (activeClass, characterIndex) => {
  const cssIndex = { "--nv-char-index": `${characterIndex}` };
  if (activeClass === "glitch") {
    return {
      ...cssIndex,
      display: "inline-block",
      transformOrigin: "center",
      animation: "nvInlineGlitchChar 1.35s steps(2, end) infinite",
      animationDelay: `-${characterIndex * 53 % 560}ms`,
      willChange: "transform, text-shadow"
    };
  }
  if (activeClass === "flutter") {
    return {
      ...cssIndex,
      display: "inline-block",
      transformOrigin: "center",
      animation: "nvInlineFlutterChar 1.8s ease-in-out infinite",
      animationDelay: `-${characterIndex * 80}ms`,
      willChange: "transform"
    };
  }
  if (activeClass === "zalgo") {
    return {
      ...cssIndex,
      display: "inline-block",
      transformOrigin: "center",
      animation: "nvInlineZalgoChar 1.2s steps(2, end) infinite",
      animationDelay: `-${characterIndex * 67 % 700}ms`,
      willChange: "transform"
    };
  }
  return {
    ...cssIndex,
    display: "inline-block",
    transformOrigin: "center bottom",
    animation: "nvInlineSighChar 620ms cubic-bezier(0.2, 0.8, 0.22, 1) 1 both",
    animationDelay: `${Math.min(characterIndex * 20, 220)}ms`,
    willChange: "transform"
  };
};
var renderPerCharacterSegment = (segmentText, activeClass, resolvedStyle, segmentKey) => {
  const characters = Array.from(segmentText);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: activeClass, style: resolvedStyle, children: characters.map((character, characterIndex) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "span",
    {
      style: getPerCharacterStyle(activeClass, characterIndex),
      children: activeClass === "zalgo" ? toZalgoCharacter(character, characterIndex) : character
    },
    `${segmentKey}-char-${characterIndex}`
  )) }, segmentKey);
};
var renderBurningSegment = (segmentText, resolvedStyle, segmentKey, formatText) => {
  if (!/\S/.test(segmentText)) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "burning", style: resolvedStyle, children: formatText(segmentText) }, segmentKey);
  }
  const visibleCharacterCount = Array.from(segmentText).filter((character) => !/\s/.test(character)).length;
  const sparkCount = Math.max(3, Math.min(6, Math.ceil(visibleCharacterCount / 3)));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "burning nv-inline-burning", style: resolvedStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "nv-inline-burning-text", children: formatText(segmentText) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "nv-inline-burning-sparks", "aria-hidden": true, children: Array.from({ length: sparkCount }).map((_, sparkIndex) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "span",
      {
        className: "nv-inline-spark",
        style: getBurningSparkStyle(sparkIndex)
      },
      `${segmentKey}-spark-${sparkIndex}`
    )) })
  ] }, segmentKey);
};
var formatInlineStyles = (text, options, initialActiveClass = null) => {
  if (!text) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, {});
  ensureInlineStyleSheet();
  const classStyles = resolveClassStyles(options);
  const styleContext = options?.styleContext ?? {};
  const formatItalics = (text2) => {
    const italicParts = text2.split(/(\*(?!\*)[^*]+\*|_[^_]+_)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: italicParts.map((italicPart, italicIndex) => {
      if (italicPart.startsWith("*") && italicPart.endsWith("*") && !italicPart.startsWith("**") || italicPart.startsWith("_") && italicPart.endsWith("_")) {
        const italicText = italicPart.slice(1, -1);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("em", { children: italicText }, italicIndex);
      } else {
        return italicPart;
      }
    }) });
  };
  const formatBold = (text2) => {
    const boldParts = text2.split(/(\*\*[^*]+\*\*)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        const boldText = boldPart.slice(2, -2);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: formatItalics(boldText) }, boldIndex);
      } else {
        return formatItalics(boldPart);
      }
    }) });
  };
  const formatStrikethrough = (text2) => {
    const strikeParts = text2.split(/(~~[^~]+~~)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: strikeParts.map((strikePart, strikeIndex) => {
      if (strikePart.startsWith("~~") && strikePart.endsWith("~~")) {
        const strikeText = strikePart.slice(2, -2);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("s", { children: formatBold(strikeText) }, strikeIndex);
      } else {
        return formatBold(strikePart);
      }
    }) });
  };
  const formatUnderline = (text2) => {
    const underlineParts = text2.split(/(__[^_]+__)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: underlineParts.map((underlinePart, underlineIndex) => {
      if (underlinePart.startsWith("__") && underlinePart.endsWith("__")) {
        const underlineText = underlinePart.slice(2, -2);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("u", { children: formatStrikethrough(underlineText) }, underlineIndex);
      } else {
        return formatStrikethrough(underlinePart);
      }
    }) });
  };
  const formatSubscript = (text2) => {
    const subscriptParts = text2.split(/(~[^~]+~)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: subscriptParts.map((subPart, subIndex) => {
      if (subPart.startsWith("~") && subPart.endsWith("~")) {
        const subText = subPart.slice(1, -1);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("sub", { children: formatUnderline(subText) }, subIndex);
      } else {
        return formatUnderline(subPart);
      }
    }) });
  };
  const formatHeaders = (text2) => {
    const headerParts = text2.split(/(#{1,6} [^\n]+)/g);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: headerParts.map((headerPart, headerIndex) => {
      if (headerPart.startsWith("#")) {
        const headerText = headerPart.replace(/^#{1,6} /, "");
        const level = headerPart.match(/^#{1,6}/)?.[0].length || 1;
        switch (level) {
          case 1:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: formatSubscript(headerText) }, headerIndex);
          case 2:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: formatSubscript(headerText) }, headerIndex);
          case 3:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: formatSubscript(headerText) }, headerIndex);
          case 4:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { children: formatSubscript(headerText) }, headerIndex);
          case 5:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h5", { children: formatSubscript(headerText) }, headerIndex);
          case 6:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h6", { children: formatSubscript(headerText) }, headerIndex);
          default:
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: formatSubscript(headerText) }, headerIndex);
        }
      } else {
        return formatSubscript(headerPart);
      }
    }) });
  };
  const renderSegment = (segmentText, activeClass, segmentKey) => {
    if (!segmentText) return null;
    if (activeClass === null) {
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react4.default.Fragment, { children: formatHeaders(segmentText) }, segmentKey);
    }
    const resolvedStyle = getResolvedClassStyle(classStyles[activeClass], styleContext);
    if (!resolvedStyle) {
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react4.default.Fragment, { children: formatHeaders(segmentText) }, segmentKey);
    }
    if (PER_CHARACTER_INLINE_CLASSES.has(activeClass) && !MARKDOWN_INLINE_PATTERN.test(segmentText)) {
      return renderPerCharacterSegment(segmentText, activeClass, resolvedStyle, segmentKey);
    }
    if (activeClass === "burning") {
      return renderBurningSegment(segmentText, resolvedStyle, segmentKey, formatHeaders);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: activeClass, style: resolvedStyle, children: formatHeaders(segmentText) }, segmentKey);
  };
  const formatTextWithClassTokens = (sourceText, keyPrefix = "inline", startingClass = null) => {
    const nodes = [];
    let lastIndex = 0;
    let segmentIndex = 0;
    let activeClass = startingClass;
    let match;
    const tagPattern = new RegExp(CLASS_TAG_PATTERN.source, "g");
    while ((match = tagPattern.exec(sourceText)) !== null) {
      const [fullMatch, tagName] = match;
      const tagStart = match.index;
      const pendingText = sourceText.slice(lastIndex, tagStart);
      const node = renderSegment(pendingText, activeClass, `${keyPrefix}-seg-${segmentIndex}`);
      if (node !== null) nodes.push(node);
      segmentIndex += 1;
      if (tagName === "") {
        activeClass = null;
      } else {
        activeClass = tagName;
      }
      lastIndex = tagStart + fullMatch.length;
    }
    const trailingText = sourceText.slice(lastIndex);
    const trailingNode = renderSegment(trailingText, activeClass, `${keyPrefix}-seg-${segmentIndex}`);
    if (trailingNode !== null) nodes.push(trailingNode);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: nodes });
  };
  return formatTextWithClassTokens(text, "inline", initialActiveClass);
};
var formatMessageWithStyles = (text, options) => {
  if (!text) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, {});
  const normalizedText = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const dialogueParts = normalizedText.split(/(\"[^\"]*\")/g);
  const brightenedColor = options.speakerThemeColor ? (0, import_styles.lighten)(options.speakerThemeColor, 0.5) : options.tokens.defaultDialogueColor;
  const dialogueStyle = {
    color: brightenedColor,
    fontFamily: options.speakerThemeFontFamily || options.tokens.fallbackFontFamily,
    textShadow: options.speakerThemeColor ? `2px 2px 2px ${(0, import_styles.darken)(options.speakerThemeColor, 0.3)}` : options.tokens.defaultDialogueShadow
  };
  const proseStyle = {
    color: options.proseColor,
    fontFamily: options.tokens.fallbackFontFamily,
    textShadow: options.tokens.baseTextShadow
  };
  let activeInlineClass = null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: dialogueParts.map((part, index) => {
    const isDialoguePart = part.startsWith('"') && part.endsWith('"');
    const baseStyle = isDialoguePart ? dialogueStyle : proseStyle;
    const formattedPart = formatInlineStyles(
      part,
      {
        ...options.inlineStyleOptions,
        styleContext: {
          ...options.inlineStyleOptions?.styleContext ?? {},
          baseColor: baseStyle.color,
          baseTextShadow: baseStyle.textShadow,
          baseFontFamily: baseStyle.fontFamily
        }
      },
      activeInlineClass
    );
    activeInlineClass = resolveEndingInlineClass(part, activeInlineClass);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: baseStyle, children: formattedPart }, index);
  }) });
};

// src/components/NovelVisualizer.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var calculateActorXPosition = (actorIndex, totalActors, anySpeaker) => {
  const leftRange = Math.min(40, Math.ceil((totalActors - 2) / 2) * 20);
  const rightRange = Math.min(40, Math.floor((totalActors - 2) / 2) * 20);
  const leftSide = actorIndex % 2 === 0;
  const indexOnSide = leftSide ? Math.floor(actorIndex / 2) : Math.floor((actorIndex - 1) / 2);
  const actorsOnSide = leftSide ? Math.ceil(totalActors / 2) : Math.floor(totalActors / 2);
  const range = leftSide ? leftRange : rightRange;
  const increment = actorsOnSide > 1 ? indexOnSide / (actorsOnSide - 1) : 0.5;
  const center = leftSide ? anySpeaker ? 25 : 30 : anySpeaker ? 75 : 70;
  const xPosition = totalActors === 1 ? 50 : Math.round(increment * range) + (center - Math.floor(range / 2));
  return xPosition;
};
function NovelVisualizer(props) {
  const theme = (0, import_styles2.useTheme)();
  const {
    script,
    actors,
    playerActorId,
    getBackgroundImageUrl,
    isVerticalLayout = false,
    typingSpeed = 20,
    allowTypingSkip = true,
    onSubmitInput,
    onUpdateMessage,
    inputPlaceholder,
    getSubmitButtonConfig,
    renderNameplate,
    responsiveOverlay,
    getActorImageUrl,
    getActorImageColorMultiplier,
    getPresentActors,
    backgroundElements,
    backgroundOptions,
    loading: externalLoading = false,
    setTooltip,
    hideInput = false,
    hideActionButtons = false,
    enablePopInSpeakers = false,
    enableAudio = true,
    enableTalkingAnimation = true,
    enableReroll = true,
    narratorLabel = "",
    inlineStyleOptions
  } = props;
  const [inputText, setInputText] = (0, import_react5.useState)("");
  const [finishTyping, setFinishTyping] = (0, import_react5.useState)(false);
  const [messageKey, setMessageKey] = import_react5.default.useState(0);
  const [hoveredActor, setHoveredActor] = (0, import_react5.useState)(null);
  const [audioEnabled, setAudioEnabled] = import_react5.default.useState(enableAudio);
  const currentAudioRef = import_react5.default.useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = import_react5.default.useState(false);
  const [mousePosition, setMousePosition] = (0, import_react5.useState)(null);
  const [messageBoxTopVh, setMessageBoxTopVh] = (0, import_react5.useState)(isVerticalLayout ? 50 : 60);
  const [loading, setLoading] = (0, import_react5.useState)(false);
  const isLoading = loading || externalLoading;
  const messageBoxRef = (0, import_react5.useRef)(null);
  const [isEditingMessage, setIsEditingMessage] = (0, import_react5.useState)(false);
  const [editedMessage, setEditedMessage] = (0, import_react5.useState)("");
  const [originalMessage, setOriginalMessage] = (0, import_react5.useState)("");
  const [localScript, setLocalScript] = (0, import_react5.useState)(script);
  const scriptEntries = (0, import_react5.useMemo)(() => localScript?.script ?? [], [localScript]);
  const [index, setIndex] = (0, import_react5.useState)(script?.currentIndex ?? -1);
  const prevIndexRef = (0, import_react5.useRef)(index);
  const prevExternalLoadingRef = (0, import_react5.useRef)(externalLoading);
  const accentMain = theme.palette.primary.main;
  const accentLight = theme.palette.primary.light;
  const errorMain = theme.palette.error.main;
  const errorLight = theme.palette.error.light;
  const baseTextShadow = (0, import_react5.useMemo)(
    () => `2px 2px 2px ${(0, import_styles2.alpha)(theme.palette.common.black, 0.8)}`,
    [theme]
  );
  const messageTokens = (0, import_react5.useMemo)(
    () => ({
      baseTextShadow,
      defaultDialogueColor: theme.palette.info.light,
      defaultDialogueShadow: `2px 2px 2px ${(0, import_styles2.alpha)(theme.palette.info.dark, 0.5)}`,
      fallbackFontFamily: theme.typography.fontFamily
    }),
    [baseTextShadow, theme]
  );
  const setCurrentIndex = (currentIndex) => {
    if (localScript) {
      localScript.currentIndex = currentIndex;
    }
    setIndex(currentIndex);
  };
  const formatMessage = (text, speakerActor2, tokens) => {
    return formatMessageWithStyles(text, {
      speakerThemeColor: speakerActor2?.themeColor,
      speakerThemeFontFamily: speakerActor2?.themeFontFamily,
      proseColor: theme.palette.text.primary,
      tokens,
      inlineStyleOptions
    });
  };
  (0, import_react5.useEffect)(() => {
    setLocalScript(script);
  }, [script, externalLoading]);
  (0, import_react5.useEffect)(() => {
    const el = messageBoxRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const topVh = rect.top / window.innerHeight * 100;
      setMessageBoxTopVh(topVh);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVerticalLayout, localScript]);
  const handleMouseMove = (e) => {
    const x = e.clientX / window.innerWidth * 100;
    const y = e.clientY / window.innerHeight * 100;
    setMousePosition({ x, y });
  };
  const actorsAtIndex = (0, import_react5.useMemo)(() => {
    if (!localScript || !Array.isArray(localScript.script)) {
      return [];
    }
    return getPresentActors(localScript, index);
  }, [localScript, index, actors, getPresentActors]);
  const focusActor = (0, import_react5.useMemo)(() => {
    for (let i = Math.min(index, scriptEntries.length - 1); i >= 0; i--) {
      const speakerId = scriptEntries[i].speakerId;
      if (speakerId && actors[speakerId]) {
        return actors[speakerId];
      }
    }
    return null;
  }, [scriptEntries, index, actors]);
  const speakerActor = (0, import_react5.useMemo)(() => {
    return index >= 0 && index < scriptEntries.length && scriptEntries[index].speakerId ? actors[scriptEntries[index].speakerId] : null;
  }, [scriptEntries, index, actors]);
  const displayMessage = (0, import_react5.useMemo)(() => {
    const message = index >= 0 && index < scriptEntries.length ? scriptEntries[index].message ?? "" : "";
    return formatMessage(message, speakerActor, messageTokens);
  }, [scriptEntries, index, speakerActor, messageTokens, isEditingMessage]);
  (0, import_react5.useEffect)(() => {
    if (prevIndexRef.current !== index) {
      setFinishTyping(false);
      if (isEditingMessage) {
        setIsEditingMessage(false);
        setOriginalMessage("");
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
      }
      if (audioEnabled && index >= 0 && index < scriptEntries.length && scriptEntries[index].speechUrl) {
        const audio = new Audio(scriptEntries[index].speechUrl);
        currentAudioRef.current = audio;
        audio.addEventListener("play", () => setIsAudioPlaying(true));
        audio.addEventListener("pause", () => setIsAudioPlaying(false));
        audio.addEventListener("ended", () => setIsAudioPlaying(false));
        audio.play().catch((err) => {
          console.error("Error playing audio:", err);
          setIsAudioPlaying(false);
        });
      }
      prevIndexRef.current = index;
    }
    setMessageKey((prev2) => prev2 + 1);
  }, [index, audioEnabled, scriptEntries]);
  (0, import_react5.useEffect)(() => {
    if (prevExternalLoadingRef.current !== externalLoading) {
      prevIndexRef.current = -1;
      setCurrentIndex(Math.min(Math.max(0, index), scriptEntries.length - 1));
      prevExternalLoadingRef.current = externalLoading;
    }
  }, [externalLoading, scriptEntries.length]);
  (0, import_react5.useEffect)(() => {
    if (!mousePosition) {
      setHoveredActor(null);
      return;
    }
    if (mousePosition.y > messageBoxTopVh) {
      setHoveredActor(null);
      return;
    }
    if (actorsAtIndex.length === 0 && !(enablePopInSpeakers && speakerActor)) {
      setHoveredActor(null);
      return;
    }
    const actorPositions = actorsAtIndex.map((actor, i) => ({
      actor,
      xPosition: calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor))
    }));
    if (enablePopInSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
      const popInSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? "left" : "right";
      actorPositions.push({
        actor: speakerActor,
        xPosition: popInSide === "left" ? 10 : 90
      });
    }
    const HOVER_RANGE = 10;
    let closestActor = null;
    let closestDistance = Infinity;
    actorPositions.forEach(({ actor, xPosition }) => {
      const actualXPosition = actor === speakerActor && actorsAtIndex.includes(actor) ? 50 : xPosition;
      const distance = Math.abs(mousePosition.x - actualXPosition);
      if (distance < closestDistance && distance <= HOVER_RANGE) {
        closestDistance = distance;
        closestActor = actor;
      }
    });
    setHoveredActor(closestActor);
  }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor, enablePopInSpeakers]);
  (0, import_react5.useEffect)(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "ArrowLeft" && !isEditingMessage && !isInputFocused && inputText.trim() === "") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight" && !isEditingMessage && !isInputFocused && inputText.trim() === "") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputText, index, localScript, finishTyping, isLoading, isEditingMessage]);
  const next = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (finishTyping) {
      setCurrentIndex(Math.min(scriptEntries.length - 1, index + 1));
    } else if (allowTypingSkip) {
      setFinishTyping(true);
    }
  };
  const prev = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    setCurrentIndex(Math.max(0, index - 1));
  };
  const handleEnterEditMode = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? "" : "";
    setOriginalMessage(currentMessage);
    setEditedMessage(currentMessage);
    setIsEditingMessage(true);
  };
  const handleConfirmEdit = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    const currentMessage = index >= 0 && index < scriptEntries.length ? scriptEntries[index]?.message ?? "" : "";
    if (editedMessage === currentMessage) {
      setIsEditingMessage(false);
      setOriginalMessage("");
      return;
    }
    if (onUpdateMessage) {
      onUpdateMessage(index, editedMessage);
    } else {
      const updated = { ...localScript };
      if (index >= 0 && index < updated.script.length && updated.script[index]) {
        updated.script[index] = { ...updated.script[index], message: editedMessage };
      }
      setLocalScript(updated);
    }
    setIsEditingMessage(false);
    setOriginalMessage("");
  };
  const handleCancelEdit = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    setEditedMessage(originalMessage);
    setIsEditingMessage(false);
    setOriginalMessage("");
  };
  const sceneEnded = Boolean(index >= 0 && index < scriptEntries.length && scriptEntries[index]?.endScene);
  const progressLabel = `${scriptEntries.length === 0 ? 0 : index + 1} / ${scriptEntries.length}`;
  const placeholderText = (0, import_react5.useMemo)(() => {
    if (!localScript || !Array.isArray(localScript.script)) return "Type your next action...";
    if (typeof inputPlaceholder === "function") {
      return inputPlaceholder({ index, entry: index >= 0 && index < scriptEntries.length ? scriptEntries[index] : void 0 });
    }
    if (inputPlaceholder) return inputPlaceholder;
    if (sceneEnded) return "End scene or type to continue...";
    if (isLoading) return "Loading...";
    return "Type your next action...";
  }, [inputPlaceholder, index, localScript, scriptEntries, sceneEnded, isLoading]);
  const renderNameplateNode = () => {
    if (renderNameplate)
      return renderNameplate(speakerActor);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      import_material.Typography,
      {
        sx: {
          fontWeight: 700,
          color: theme.palette.primary.light,
          fontSize: isVerticalLayout ? "0.85rem" : "1rem",
          textShadow: baseTextShadow
        },
        children: speakerActor ? speakerActor.name : narratorLabel
      }
    );
  };
  const renderActors = () => {
    if (!localScript || !Array.isArray(localScript.script)) {
      return [];
    }
    const activeScript = localScript;
    const scalePerActor = isVerticalLayout ? 0.05 : 0.03;
    const sceneActorScale = Math.max(0.7, 1 - Math.max(0, actorsAtIndex.length - 1) * scalePerActor);
    const actorElements = actorsAtIndex.map((actor, i) => {
      const xPosition = actor === focusActor ? 50 : calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
      const isSpeaking = actor === speakerActor;
      const isHovered = actor === hoveredActor;
      const yPosition = isVerticalLayout ? 15 : 0;
      const zIndex = 50 - Math.abs(xPosition - 50);
      const baseHighlightColor = getActorImageColorMultiplier ? getActorImageColorMultiplier(actor, activeScript, index) : "#ffffff";
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        ActorImage_default,
        {
          id: actor.id,
          resolveImageUrl: () => {
            return getActorImageUrl(actor, activeScript, index);
          },
          xPosition,
          yPosition,
          zIndex,
          heightMultiplier: (isSpeaking ? 1 : sceneActorScale) * (actor.heightMultiplier ?? 1),
          speaker: isSpeaking,
          highlightColor: isHovered ? (0, import_styles2.lighten)(baseHighlightColor, 0.2) : baseHighlightColor,
          isAudioPlaying: isSpeaking && isAudioPlaying && enableTalkingAnimation
        },
        actor.id
      );
    });
    if (enablePopInSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
      const yPosition = isVerticalLayout ? 20 : 0;
      const isHovered = speakerActor === hoveredActor;
      const popInSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? "left" : "right";
      const baseHighlightColor = getActorImageColorMultiplier ? getActorImageColorMultiplier(speakerActor, activeScript, index) : "#ffffff";
      actorElements.push(
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          ActorImage_default,
          {
            id: `pop-in-${speakerActor.id}`,
            resolveImageUrl: () => {
              return getActorImageUrl(speakerActor, activeScript, index);
            },
            xPosition: popInSide === "left" ? 10 : 90,
            yPosition,
            zIndex: 45,
            heightMultiplier: (isVerticalLayout ? 0.7 : 0.9) * (speakerActor.heightMultiplier ?? 1),
            speaker: true,
            highlightColor: isHovered ? (0, import_styles2.lighten)(baseHighlightColor, 0.2) : baseHighlightColor,
            popInSide,
            isAudioPlaying: isAudioPlaying && enableTalkingAnimation
          },
          `pop-in-${speakerActor.id}`
        )
      );
    }
    return actorElements;
  };
  const handleSubmit = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (!inputText.trim() && index < scriptEntries.length - 1) {
      next();
      return;
    }
    let atIndex = index;
    if (inputText.trim()) {
      localScript.script = localScript.script.slice(0, index + 1);
      localScript.script.push({
        speakerId: playerActorId,
        message: inputText,
        speechUrl: ""
      });
      setLocalScript({ ...localScript });
      setCurrentIndex(localScript.script.length - 1);
      atIndex = localScript.script.length - 1;
    }
    if (onSubmitInput) {
      setLoading(true);
      const tempScript = { ...localScript };
      onSubmitInput(inputText, tempScript, atIndex).then((newScript) => {
        setLoading(false);
        if (newScript) {
          if (newScript.id !== tempScript.id) {
            setCurrentIndex(0);
          } else {
            setCurrentIndex(Math.min((newScript?.script?.length ?? 0) - 1, atIndex + 1));
          }
        } else {
          setCurrentIndex(-1);
        }
        setLocalScript(newScript ? { ...newScript } : null);
      }).catch((error) => {
        console.log("Submission failed", error);
        setLoading(false);
      });
    }
    setInputText("");
  };
  const handleReroll = () => {
    if (!localScript || !Array.isArray(localScript.script)) return;
    const rerollIndex = index;
    const tempScript = { ...localScript, script: localScript.script.slice(0, rerollIndex) };
    console.log("Reroll clicked");
    if (onSubmitInput) {
      setLoading(true);
      console.log("Rerolling");
      onSubmitInput(inputText, tempScript, rerollIndex - 1).then((newScript) => {
        setLoading(false);
        setCurrentIndex(Math.min((newScript?.script?.length ?? 0) - 1, rerollIndex));
        setLocalScript(newScript ? { ...newScript } : null);
      }).catch((error) => {
        console.log("Reroll failed", error);
        setLoading(false);
      });
    }
  };
  const responsiveOverlayNode = responsiveOverlay ? responsiveOverlay(hoveredActor) : null;
  const backgroundImageUrl = (0, import_react5.useMemo)(
    () => getBackgroundImageUrl && localScript ? getBackgroundImageUrl(localScript, index) : void 0,
    [getBackgroundImageUrl, localScript, index]
  );
  const resolvedBackgroundElements = (0, import_react5.useMemo)(() => {
    if (typeof backgroundElements === "function") {
      if (!localScript) {
        return null;
      }
      return backgroundElements({
        script: localScript,
        index,
        presentActors: actorsAtIndex
      });
    }
    return backgroundElements ?? null;
  }, [backgroundElements, localScript, index, actorsAtIndex]);
  const responsiveOverlayTop = isVerticalLayout ? 2 : 5;
  const responsiveOverlaySides = isVerticalLayout ? 2 : 5;
  const responsiveOverlayBottomGap = isVerticalLayout ? 1 : 2;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    BlurredBackground,
    {
      imageUrl: backgroundImageUrl,
      brightness: backgroundOptions?.brightness,
      contrast: backgroundOptions?.contrast,
      blur: backgroundOptions?.blur,
      scale: backgroundOptions?.scale,
      overlay: backgroundOptions?.overlay,
      transitionDuration: backgroundOptions?.transitionDuration,
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "div",
        {
          style: { position: "relative", width: "100vw", height: "100vh" },
          onMouseMove: handleMouseMove,
          onMouseLeave: () => setMousePosition(null),
          children: [
            resolvedBackgroundElements && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { position: "absolute", inset: 0, zIndex: 0 }, children: resolvedBackgroundElements }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { position: "absolute", inset: 0, zIndex: 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_framer_motion2.AnimatePresence, { children: renderActors() }) }),
            responsiveOverlayNode && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "div",
              {
                style: {
                  position: "absolute",
                  top: `${responsiveOverlayTop}%`,
                  bottom: `${100 - messageBoxTopVh + responsiveOverlayBottomGap}%`,
                  right: `${responsiveOverlaySides}%`,
                  left: `${responsiveOverlaySides}%`,
                  zIndex: 3,
                  overflow: "hidden"
                },
                children: responsiveOverlayNode
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
              import_material.Paper,
              {
                ref: messageBoxRef,
                elevation: 8,
                sx: {
                  position: "absolute",
                  left: isVerticalLayout ? "2%" : "5%",
                  right: isVerticalLayout ? "2%" : "5%",
                  bottom: isVerticalLayout ? "1%" : "4%",
                  background: (0, import_styles2.alpha)(theme.palette.background.paper, 0.92),
                  border: `2px solid ${(0, import_styles2.alpha)(theme.palette.divider, 0.3)}`,
                  borderRadius: 3,
                  p: 2,
                  color: theme.palette.text.primary,
                  zIndex: 2,
                  backdropFilter: "blur(8px)",
                  minHeight: isVerticalLayout ? "20vh" : void 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "visible"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_material.Box, { sx: { display: "flex", alignItems: "flex-end", overflow: "visible" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_material.Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "flex-end", flex: 1, overflow: "visible" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.IconButton,
                        {
                          onClick: prev,
                          disabled: index === 0 || isLoading,
                          size: "small",
                          sx: {
                            color: theme.palette.text.secondary,
                            border: `1px solid ${(0, import_styles2.alpha)(theme.palette.divider, 0.2)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.ChevronLeft, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "14px" : void 0 } })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.Chip,
                        {
                          label: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                            import_material.CircularProgress,
                            {
                              size: isVerticalLayout ? 12 : 16,
                              sx: { color: theme.palette.primary.light },
                              onMouseEnter: () => {
                                setTooltip?.("Awaiting content from the LLM", import_icons_material.Computer);
                              },
                              onMouseLeave: () => setTooltip?.(null)
                            }
                          ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: isVerticalLayout ? "2px" : "4px" }, children: [
                            index + 1 < scriptEntries.length && inputText.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                              "span",
                              {
                                onMouseEnter: () => {
                                  setTooltip?.("Sending input will replace subsequent messages", import_icons_material.Warning);
                                },
                                onMouseLeave: () => setTooltip?.(null),
                                style: {
                                  color: theme.palette.text.secondary
                                },
                                children: "\u26A0"
                              }
                            ),
                            progressLabel
                          ] }),
                          sx: {
                            minWidth: isVerticalLayout ? 50 : 72,
                            height: isVerticalLayout ? "24px" : void 0,
                            fontSize: isVerticalLayout ? "0.7rem" : void 0,
                            fontWeight: 700,
                            color: theme.palette.primary.light,
                            border: `1px solid ${(0, import_styles2.alpha)(theme.palette.divider, 0.2)}`,
                            transition: "all 0.3s ease",
                            "& .MuiChip-label": {
                              display: "flex",
                              alignItems: "center",
                              gap: isVerticalLayout ? 0.25 : 0.5,
                              padding: isVerticalLayout ? "0 6px" : void 0
                            }
                          }
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.IconButton,
                        {
                          onClick: next,
                          disabled: index >= scriptEntries.length - 1 || isLoading,
                          size: "small",
                          sx: {
                            color: theme.palette.text.secondary,
                            border: `1px solid ${(0, import_styles2.alpha)(theme.palette.divider, 0.2)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.ChevronRight, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "14px" : void 0 } })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.Box,
                        {
                          sx: {
                            height: 0,
                            overflow: "visible",
                            display: "flex",
                            alignItems: "flex-end",
                            alignSelf: "flex-end"
                          },
                          children: renderNameplateNode()
                        }
                      )
                    ] }),
                    !hideActionButtons && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_material.Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "center" }, children: [
                      !isEditingMessage ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.IconButton,
                        {
                          onClick: handleEnterEditMode,
                          onMouseEnter: () => {
                            setTooltip?.("Edit message", import_icons_material.Edit);
                          },
                          onMouseLeave: () => setTooltip?.(null),
                          disabled: isLoading,
                          size: "small",
                          sx: {
                            color: accentMain,
                            border: `1px solid ${(0, import_styles2.alpha)(accentMain, 0.25)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            opacity: 1,
                            transform: "scale(1)",
                            transition: "all 0.3s ease",
                            animation: "fadeIn 0.3s ease",
                            "@keyframes fadeIn": {
                              from: { opacity: 0, transform: "scale(0.8)" },
                              to: { opacity: 1, transform: "scale(1)" }
                            },
                            "&:hover": {
                              borderColor: (0, import_styles2.alpha)(accentMain, 0.4),
                              color: accentLight
                            },
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Edit, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                          import_material.IconButton,
                          {
                            onClick: handleConfirmEdit,
                            onMouseEnter: () => {
                              setTooltip?.("Confirm changes", import_icons_material.Check);
                            },
                            onMouseLeave: () => setTooltip?.(null),
                            size: "small",
                            sx: {
                              color: accentMain,
                              border: `1px solid ${(0, import_styles2.alpha)(accentMain, 0.25)}`,
                              padding: isVerticalLayout ? "4px" : void 0,
                              minWidth: isVerticalLayout ? "28px" : void 0,
                              opacity: 1,
                              transform: "scale(1)",
                              transition: "all 0.3s ease",
                              animation: "fadeIn 0.3s ease",
                              "@keyframes fadeIn": {
                                from: { opacity: 0, transform: "scale(0.8)" },
                                to: { opacity: 1, transform: "scale(1)" }
                              },
                              "&:hover": {
                                borderColor: (0, import_styles2.alpha)(accentMain, 0.4),
                                color: accentLight
                              }
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Check, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                          import_material.IconButton,
                          {
                            onClick: handleCancelEdit,
                            onMouseEnter: () => {
                              setTooltip?.("Discard changes", import_icons_material.Clear);
                            },
                            onMouseLeave: () => setTooltip?.(null),
                            size: "small",
                            sx: {
                              color: errorMain,
                              border: `1px solid ${(0, import_styles2.alpha)(errorMain, 0.25)}`,
                              padding: isVerticalLayout ? "4px" : void 0,
                              minWidth: isVerticalLayout ? "28px" : void 0,
                              opacity: 1,
                              transform: "scale(1)",
                              transition: "all 0.3s ease",
                              animation: "fadeIn 0.3s ease",
                              "@keyframes fadeIn": {
                                from: { opacity: 0, transform: "scale(0.8)" },
                                to: { opacity: 1, transform: "scale(1)" }
                              },
                              "&:hover": {
                                borderColor: (0, import_styles2.alpha)(errorMain, 0.4),
                                color: errorLight
                              }
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Clear, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                          }
                        )
                      ] }),
                      enableReroll && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.IconButton,
                        {
                          onClick: handleReroll,
                          onMouseEnter: () => {
                            setTooltip?.("Regenerate events from this point", import_icons_material.Casino);
                          },
                          onMouseLeave: () => setTooltip?.(null),
                          disabled: isLoading,
                          size: "small",
                          sx: {
                            color: accentMain,
                            border: `1px solid ${(0, import_styles2.alpha)(accentMain, 0.25)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              borderColor: (0, import_styles2.alpha)(accentMain, 0.4),
                              color: accentLight,
                              transform: "rotate(180deg)"
                            },
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Casino, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    import_material.Box,
                    {
                      sx: {
                        my: isVerticalLayout ? 1 : 2,
                        minHeight: "4rem",
                        cursor: isEditingMessage ? "text" : "pointer",
                        borderRadius: 1,
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor: isEditingMessage ? "transparent" : theme.palette.action.hover
                        }
                      },
                      onClick: () => {
                        if (!isEditingMessage && !isLoading) {
                          if (!finishTyping) {
                            setFinishTyping(true);
                          } else if (allowTypingSkip) {
                            next();
                          }
                        }
                      },
                      children: isEditingMessage ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.TextField,
                        {
                          fullWidth: true,
                          multiline: true,
                          value: editedMessage,
                          onChange: (e) => setEditedMessage(e.target.value),
                          autoFocus: true,
                          onKeyDown: (e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              e.preventDefault();
                              handleConfirmEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          },
                          sx: {
                            "& .MuiInputBase-root": {
                              fontSize: isVerticalLayout ? "clamp(0.75rem, 2vw, 1.18rem)" : "1.18rem",
                              lineHeight: 1.55,
                              fontFamily: theme.typography.fontFamily,
                              color: theme.palette.text.primary,
                              backgroundColor: (0, import_styles2.alpha)(theme.palette.action.selected, 0.5),
                              padding: "8px"
                            },
                            "& .MuiInputBase-input": {
                              padding: 0
                            }
                          }
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        import_material.Typography,
                        {
                          variant: "body1",
                          sx: {
                            fontSize: isVerticalLayout ? "clamp(0.75rem, 2vw, 1.18rem)" : "1.18rem",
                            lineHeight: 1.55,
                            fontFamily: theme.typography.fontFamily,
                            color: theme.palette.text.primary,
                            textShadow: baseTextShadow
                          },
                          children: scriptEntries.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                            TypeOut_default,
                            {
                              speed: typingSpeed,
                              finishTyping,
                              onTypingComplete: () => setFinishTyping(true),
                              children: displayMessage
                            },
                            `typeout-${messageKey}`
                          ) : ""
                        }
                      )
                    }
                  ),
                  !hideInput && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_material.Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "center" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                      import_material.TextField,
                      {
                        fullWidth: true,
                        value: inputText,
                        onChange: (e) => setInputText(e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!isLoading) {
                              handleSubmit();
                            }
                          }
                        },
                        placeholder: placeholderText,
                        disabled: isLoading,
                        variant: "outlined",
                        size: "small",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            background: theme.palette.action.hover,
                            color: theme.palette.text.primary,
                            fontSize: isVerticalLayout ? "0.75rem" : void 0,
                            "& fieldset": {
                              borderColor: theme.palette.divider
                            },
                            "&:hover fieldset": {
                              borderColor: (0, import_styles2.alpha)(theme.palette.divider, 0.8)
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: accentMain
                            },
                            "&.Mui-disabled": {
                              color: theme.palette.text.disabled,
                              "& fieldset": {
                                borderColor: (0, import_styles2.alpha)(theme.palette.divider, 0.5)
                              }
                            }
                          },
                          "& .MuiInputBase-input": {
                            padding: isVerticalLayout ? "6px 8px" : void 0
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: (0, import_styles2.alpha)(theme.palette.text.primary, 0.55),
                            opacity: 1,
                            fontSize: isVerticalLayout ? "0.75rem" : void 0
                          },
                          "& .MuiInputBase-input.Mui-disabled::placeholder": {
                            color: (0, import_styles2.alpha)(theme.palette.text.primary, 0.4),
                            opacity: 1
                          },
                          "& .MuiInputBase-input.Mui-disabled": {
                            color: (0, import_styles2.alpha)(theme.palette.text.primary, 0.45),
                            WebkitTextFillColor: (0, import_styles2.alpha)(theme.palette.text.primary, 0.45)
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                      import_material.Button,
                      {
                        onClick: handleSubmit,
                        disabled: isLoading,
                        variant: "contained",
                        startIcon: (() => {
                          if (getSubmitButtonConfig && localScript) {
                            return getSubmitButtonConfig(localScript, index, inputText).icon;
                          }
                          if (sceneEnded && !inputText.trim()) {
                            return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Close, { fontSize: isVerticalLayout ? "small" : void 0 });
                          }
                          return inputText.trim() ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Send, { fontSize: isVerticalLayout ? "small" : void 0 }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_icons_material.Forward, { fontSize: isVerticalLayout ? "small" : void 0 });
                        })(),
                        sx: {
                          height: "40px",
                          minHeight: "40px",
                          background: (() => {
                            const colorScheme = getSubmitButtonConfig ? localScript ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : "primary" : sceneEnded && !inputText.trim() ? "error" : "primary";
                            const baseColor = colorScheme === "error" ? errorMain : accentMain;
                            return `linear-gradient(90deg, ${(0, import_styles2.lighten)(baseColor, 0.12)}, ${(0, import_styles2.darken)(baseColor, 0.2)})`;
                          })(),
                          color: (() => {
                            const colorScheme = getSubmitButtonConfig ? localScript ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : "primary" : sceneEnded && !inputText.trim() ? "error" : "primary";
                            const baseColor = colorScheme === "error" ? errorMain : accentMain;
                            return theme.palette.getContrastText(baseColor);
                          })(),
                          fontWeight: 800,
                          fontSize: isVerticalLayout ? "clamp(0.6rem, 2vw, 0.875rem)" : void 0,
                          padding: isVerticalLayout ? "4px 10px" : void 0,
                          whiteSpace: "nowrap",
                          "&:hover": {
                            background: (() => {
                              const colorScheme = getSubmitButtonConfig ? localScript ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : "primary" : sceneEnded && !inputText.trim() ? "error" : "primary";
                              const baseColor = colorScheme === "error" ? errorMain : accentMain;
                              return `linear-gradient(90deg, ${(0, import_styles2.lighten)(baseColor, 0.2)}, ${(0, import_styles2.darken)(baseColor, 0.28)})`;
                            })()
                          },
                          "&:disabled": {
                            background: theme.palette.action.disabledBackground,
                            color: theme.palette.text.disabled
                          }
                        },
                        children: (() => {
                          if (getSubmitButtonConfig) {
                            return localScript ? getSubmitButtonConfig(localScript, index, inputText).label : "Continue";
                          }
                          if (sceneEnded && !inputText.trim()) {
                            return "End";
                          }
                          return inputText.trim() ? "Send" : "Continue";
                        })()
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      )
    }
  );
}
var NovelVisualizer_default = NovelVisualizer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActorImage,
  BlurredBackground,
  NovelVisualizer,
  TypeOut,
  defaultInlineClassStyles,
  formatInlineStyles
});
