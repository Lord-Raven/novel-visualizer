// src/components/NovelVisualizer.tsx
import React3, { useEffect as useEffect3, useMemo as useMemo2, useRef as useRef2, useState as useState3 } from "react";
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from "@mui/material";
import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino } from "@mui/icons-material";

// src/components/ActorImage.tsx
import { motion, easeOut, easeIn, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var IDLE_HEIGHT = 80;
var SPEAKING_HEIGHT = 90;
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
  isGhost = false,
  ghostSide = "left",
  isAudioPlaying = false
}) => {
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [prevImageUrl, setPrevImageUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9 / 16");
  const imageUrl = resolveImageUrl();
  const prevRawImageUrl = useRef(imageUrl);
  useEffect(() => {
    if (!imageUrl) {
      setProcessedImageUrl(imageUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      }
      const result = multiplyImageByColor(img, highlightColor);
      if (result) {
        setProcessedImageUrl(result);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, highlightColor]);
  useEffect(() => {
    if (prevRawImageUrl.current !== imageUrl) {
      setPrevImageUrl(processedImageUrl);
      prevRawImageUrl.current = imageUrl;
    }
  }, [imageUrl, processedImageUrl]);
  const baseX = speaker ? 50 : xPosition;
  const baseY = yPosition;
  const variants = useMemo(() => {
    if (isGhost) {
      const ghostX = ghostSide === "left" ? 10 : 90;
      const offscreenX = ghostSide === "left" ? -20 : 120;
      const tiltRotate = ghostSide === "left" ? 15 : -15;
      return {
        absent: {
          opacity: 0,
          x: `${offscreenX}vw`,
          bottom: `${baseY}vh`,
          height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.7)",
          rotate: tiltRotate * 1.5,
          transition: {
            x: { ease: easeIn, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { ease: easeOut, duration: 0.3 },
            rotate: { duration: 0.4 }
          }
        },
        talking: {
          opacity: 0.85,
          x: `${ghostX}vw`,
          bottom: `${baseY}vh`,
          height: `${SPEAKING_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.9)",
          rotate: tiltRotate,
          transition: {
            x: { ease: easeOut, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { ease: easeOut, duration: 0.4 },
            rotate: { duration: 0.4 }
          }
        },
        idle: {
          opacity: 0.85,
          x: `${ghostX}vw`,
          bottom: `${baseY}vh`,
          height: `${IDLE_HEIGHT * heightMultiplier * 0.8}vh`,
          filter: "brightness(0.7)",
          rotate: tiltRotate,
          transition: {
            x: { ease: easeOut, duration: 0.4 },
            bottom: { duration: 0.4 },
            opacity: { ease: easeOut, duration: 0.4 },
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
        transition: { x: { ease: easeIn, duration: 0.5 }, bottom: { duration: 0.5 }, opacity: { ease: easeOut, duration: 0.5 } }
      },
      talking: {
        opacity: 1,
        x: `${baseX}vw`,
        bottom: `${baseY}vh`,
        height: `${SPEAKING_HEIGHT * heightMultiplier}vh`,
        filter: "brightness(1)",
        transition: { x: { ease: easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: easeOut, duration: 0.3 } }
      },
      idle: {
        opacity: 1,
        x: `${baseX}vw`,
        bottom: `${baseY}vh`,
        height: `${IDLE_HEIGHT * heightMultiplier}vh`,
        filter: "brightness(0.8)",
        transition: { x: { ease: easeIn, duration: 0.3 }, bottom: { duration: 0.3 }, opacity: { ease: easeOut, duration: 0.3 } }
      }
    };
  }, [baseX, baseY, yPosition, zIndex, heightMultiplier, isGhost, ghostSide]);
  const animationParams = useMemo(() => {
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random1 = Math.sin(seed) * 1e4 % 1;
    const random2 = Math.sin(seed + 1) * 1e4 % 1;
    const squish = 0.99 + (random1 * 4e-3 - 2e-3);
    const stretch = 1.01 + (random2 * 4e-3 - 2e-3);
    const duration = 0.3 + random1 * 0.1;
    return { squish, stretch, duration };
  }, [id]);
  const talkingAnimationProps = isAudioPlaying ? {
    scaleY: [1, animationParams.squish, animationParams.stretch, 1],
    transition: {
      scaleY: {
        duration: animationParams.duration,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  } : {};
  return processedImageUrl ? /* @__PURE__ */ jsxs(
    motion.div,
    {
      variants,
      initial: "absent",
      exit: "absent",
      animate: speaker ? { ...variants.talking, ...talkingAnimationProps } : "idle",
      style: { position: "absolute", width: "auto", aspectRatio, overflow: "visible", zIndex: speaker ? 100 : zIndex, transformOrigin: "bottom center" },
      children: [
        /* @__PURE__ */ jsx(AnimatePresence, { children: prevImageUrl && prevImageUrl !== processedImageUrl && /* @__PURE__ */ jsx(
          motion.img,
          {
            src: prevImageUrl,
            initial: { opacity: 1 },
            animate: { opacity: 0 },
            exit: { opacity: 0 },
            transition: { duration: 0.5 },
            style: {
              position: "absolute",
              top: 0,
              width: "100%",
              height: "100%",
              filter: "blur(2.5px)",
              zIndex: 3,
              transform: `translateX(-50%)`,
              pointerEvents: "none"
            }
          },
          `${id}_${prevImageUrl}_prev`
        ) }),
        /* @__PURE__ */ jsx(AnimatePresence, { children: processedImageUrl && /* @__PURE__ */ jsx(
          motion.img,
          {
            src: processedImageUrl,
            initial: { opacity: 0 },
            animate: { opacity: 1, filter: "blur(2.5px)" },
            exit: { opacity: 0 },
            transition: { duration: 0.5 },
            style: {
              position: "absolute",
              top: 0,
              width: "100%",
              height: "100%",
              zIndex: 4,
              transform: `translateX(-50%)`,
              pointerEvents: "none"
            }
          },
          `${id}_${imageUrl}_bg`
        ) }),
        /* @__PURE__ */ jsx(AnimatePresence, { children: processedImageUrl && /* @__PURE__ */ jsx(
          motion.img,
          {
            src: processedImageUrl,
            initial: { opacity: 0 },
            animate: { opacity: 0.75 },
            exit: { opacity: 0 },
            transition: { duration: 0.5 },
            style: {
              position: "absolute",
              top: 0,
              width: "100%",
              height: "100%",
              zIndex: 5,
              transform: `translateX(-50%)`
            },
            onMouseEnter,
            onMouseLeave
          },
          `${id}_${imageUrl}_main`
        ) })
      ]
    },
    `actor_motion_div_${id}`
  ) : /* @__PURE__ */ jsx(Fragment, {});
};
var multiplyImageByColor = (img, hex) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = hex.toUpperCase();
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL();
};
var ActorImage_default = memo(ActorImage);

// src/components/BlurredBackground.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
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
  const [currentImage, setCurrentImage] = useState2(imageUrl);
  const [previousImage, setPreviousImage] = useState2(null);
  const [isTransitioning, setIsTransitioning] = useState2(false);
  useEffect2(() => {
    if (imageUrl !== currentImage) {
      setPreviousImage(currentImage);
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentImage(imageUrl);
        setIsTransitioning(false);
        const cleanupTimer = setTimeout(() => {
          setPreviousImage(null);
        }, transitionDuration);
        return () => clearTimeout(cleanupTimer);
      }, 50);
      return () => clearTimeout(timer);
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
  return /* @__PURE__ */ jsxs2("div", { style: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden"
  }, children: [
    previousImage && /* @__PURE__ */ jsx2("div", { style: {
      ...imageStyle,
      backgroundImage: `url(${previousImage})`,
      opacity: isTransitioning ? 0 : 1,
      zIndex: 0
    } }),
    /* @__PURE__ */ jsx2("div", { style: {
      ...imageStyle,
      backgroundImage: `url(${currentImage})`,
      opacity: 1,
      zIndex: previousImage ? 1 : 0
    } }),
    overlay && /* @__PURE__ */ jsx2("div", { style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: overlay,
      zIndex: 1
    } }),
    /* @__PURE__ */ jsx2("div", { style: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      height: "100%"
    }, children })
  ] });
};
var BlurredBackground_default = BlurredBackground;

// src/components/TypeOut.tsx
import React2 from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var extractTextContent = (node) => {
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (React2.isValidElement(node)) {
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
    if (React2.isValidElement(n)) {
      const children = n.props.children;
      if (children !== void 0 && children !== null) {
        const truncatedChildren = truncateNode(children);
        if (truncatedChildren !== null || !children) {
          return React2.cloneElement(n, { ...n.props, key }, truncatedChildren);
        }
        return null;
      }
      return React2.cloneElement(n, { ...n.props, key });
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
  const [displayLength, setDisplayLength] = React2.useState(0);
  const [finished, setFinished] = React2.useState(false);
  const timerRef = React2.useRef(null);
  const textContent = React2.useMemo(() => extractTextContent(children), [children]);
  const prevTextContentRef = React2.useRef("");
  const onTypingCompleteRef = React2.useRef(onTypingComplete);
  React2.useEffect(() => {
    onTypingCompleteRef.current = onTypingComplete;
  }, [onTypingComplete]);
  React2.useEffect(() => {
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
  React2.useEffect(() => {
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
  const displayContent = React2.useMemo(() => {
    if (displayLength === 0) {
      return null;
    }
    if (finished || finishTyping && displayLength >= textContent.length) {
      return children;
    }
    return truncateReactContent(children, displayLength);
  }, [children, displayLength, finished, finishTyping, textContent.length]);
  return /* @__PURE__ */ jsx3(
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
import { Fragment as Fragment2, jsx as jsx4 } from "react/jsx-runtime";
var formatInlineStyles = (text) => {
  if (!text) return /* @__PURE__ */ jsx4(Fragment2, {});
  const formatItalics = (text2) => {
    const italicParts = text2.split(/(\*(?!\*)[^*]+\*|_[^_]+_)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: italicParts.map((italicPart, italicIndex) => {
      if (italicPart.startsWith("*") && italicPart.endsWith("*") && !italicPart.startsWith("**") || italicPart.startsWith("_") && italicPart.endsWith("_")) {
        const italicText = italicPart.slice(1, -1);
        return /* @__PURE__ */ jsx4("em", { children: italicText }, italicIndex);
      } else {
        return italicPart;
      }
    }) });
  };
  const formatBold = (text2) => {
    const boldParts = text2.split(/(\*\*[^*]+\*\*)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        const boldText = boldPart.slice(2, -2);
        return /* @__PURE__ */ jsx4("strong", { children: formatItalics(boldText) }, boldIndex);
      } else {
        return formatItalics(boldPart);
      }
    }) });
  };
  const formatStrikethrough = (text2) => {
    const strikeParts = text2.split(/(~~[^~]+~~)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: strikeParts.map((strikePart, strikeIndex) => {
      if (strikePart.startsWith("~~") && strikePart.endsWith("~~")) {
        const strikeText = strikePart.slice(2, -2);
        return /* @__PURE__ */ jsx4("s", { children: formatBold(strikeText) }, strikeIndex);
      } else {
        return formatBold(strikePart);
      }
    }) });
  };
  const formatUnderline = (text2) => {
    const underlineParts = text2.split(/(__[^_]+__)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: underlineParts.map((underlinePart, underlineIndex) => {
      if (underlinePart.startsWith("__") && underlinePart.endsWith("__")) {
        const underlineText = underlinePart.slice(2, -2);
        return /* @__PURE__ */ jsx4("u", { children: formatStrikethrough(underlineText) }, underlineIndex);
      } else {
        return formatStrikethrough(underlinePart);
      }
    }) });
  };
  const formatSubscript = (text2) => {
    const subscriptParts = text2.split(/(~[^~]+~)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: subscriptParts.map((subPart, subIndex) => {
      if (subPart.startsWith("~") && subPart.endsWith("~")) {
        const subText = subPart.slice(1, -1);
        return /* @__PURE__ */ jsx4("sub", { children: formatUnderline(subText) }, subIndex);
      } else {
        return formatUnderline(subPart);
      }
    }) });
  };
  const formatHeaders = (text2) => {
    const headerParts = text2.split(/(#{1,6} [^\n]+)/g);
    return /* @__PURE__ */ jsx4(Fragment2, { children: headerParts.map((headerPart, headerIndex) => {
      if (headerPart.startsWith("#")) {
        const headerText = headerPart.replace(/^#{1,6} /, "");
        const level = headerPart.match(/^#{1,6}/)?.[0].length || 1;
        switch (level) {
          case 1:
            return /* @__PURE__ */ jsx4("h1", { children: formatSubscript(headerText) }, headerIndex);
          case 2:
            return /* @__PURE__ */ jsx4("h2", { children: formatSubscript(headerText) }, headerIndex);
          case 3:
            return /* @__PURE__ */ jsx4("h3", { children: formatSubscript(headerText) }, headerIndex);
          case 4:
            return /* @__PURE__ */ jsx4("h4", { children: formatSubscript(headerText) }, headerIndex);
          case 5:
            return /* @__PURE__ */ jsx4("h5", { children: formatSubscript(headerText) }, headerIndex);
          case 6:
            return /* @__PURE__ */ jsx4("h6", { children: formatSubscript(headerText) }, headerIndex);
          default:
            return /* @__PURE__ */ jsx4("span", { children: formatSubscript(headerText) }, headerIndex);
        }
      } else {
        return formatSubscript(headerPart);
      }
    }) });
  };
  return formatHeaders(text);
};

// src/components/NovelVisualizer.tsx
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var adjustColor = (color, amount = 0.6) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};
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
  const theme = useTheme();
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
    renderActorHoverInfo,
    getActorImageUrl,
    getPresentActors,
    backgroundOptions,
    hideInput = false,
    hideActionButtons = false,
    enableGhostSpeakers = false,
    enableAudio = true,
    enableTalkingAnimation = true,
    enableReroll = true,
    narratorLabel = ""
  } = props;
  const [inputText, setInputText] = useState3("");
  const [finishTyping, setFinishTyping] = useState3(false);
  const [messageKey, setMessageKey] = React3.useState(0);
  const [hoveredActor, setHoveredActor] = useState3(null);
  const [audioEnabled, setAudioEnabled] = React3.useState(enableAudio);
  const currentAudioRef = React3.useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = React3.useState(false);
  const [mousePosition, setMousePosition] = useState3(null);
  const [messageBoxTopVh, setMessageBoxTopVh] = useState3(isVerticalLayout ? 50 : 60);
  const [loading, setLoading] = useState3(false);
  const messageBoxRef = useRef2(null);
  const [isEditingMessage, setIsEditingMessage] = useState3(false);
  const [editedMessage, setEditedMessage] = useState3("");
  const [originalMessage, setOriginalMessage] = useState3("");
  const [localScript, setLocalScript] = useState3(script);
  const [index, setIndex] = useState3(0);
  const prevIndexRef = useRef2(index);
  const accentMain = theme.palette.primary.main;
  const accentLight = theme.palette.primary.light;
  const errorMain = theme.palette.error.main;
  const errorLight = theme.palette.error.light;
  const baseTextShadow = useMemo2(
    () => `2px 2px 2px ${alpha(theme.palette.common.black, 0.8)}`,
    [theme]
  );
  const messageTokens = useMemo2(
    () => ({
      baseTextShadow,
      defaultDialogueColor: theme.palette.info.light,
      defaultDialogueShadow: `2px 2px 2px ${alpha(theme.palette.info.dark, 0.5)}`,
      fallbackFontFamily: theme.typography.fontFamily
    }),
    [baseTextShadow, theme]
  );
  const formatMessage = (text, speakerActor2, tokens) => {
    if (!text) return /* @__PURE__ */ jsx5(Fragment3, {});
    text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const dialogueParts = text.split(/(\"[^\"]*\")/g);
    const brightenedColor = speakerActor2?.themeColor ? adjustColor(speakerActor2.themeColor, 0.6) : tokens.defaultDialogueColor;
    const dialogueStyle = {
      color: brightenedColor,
      fontFamily: speakerActor2?.themeFontFamily || tokens.fallbackFontFamily,
      textShadow: speakerActor2?.themeColor ? `2px 2px 2px ${adjustColor(speakerActor2.themeColor, -0.25)}` : tokens.defaultDialogueShadow
    };
    const proseStyle = {
      color: theme.palette.text.primary,
      fontFamily: tokens.fallbackFontFamily,
      textShadow: tokens.baseTextShadow
    };
    return /* @__PURE__ */ jsx5(Fragment3, { children: dialogueParts.map((part, index2) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return /* @__PURE__ */ jsx5("span", { style: dialogueStyle, children: formatInlineStyles(part) }, index2);
      }
      return /* @__PURE__ */ jsx5("span", { style: proseStyle, children: formatInlineStyles(part) }, index2);
    }) });
  };
  useEffect3(() => {
    setLocalScript(script);
  }, [script]);
  useEffect3(() => {
    if (messageBoxRef.current) {
      const rect = messageBoxRef.current.getBoundingClientRect();
      const topVh = rect.top / window.innerHeight * 100;
      setMessageBoxTopVh(topVh);
    }
  }, [isVerticalLayout, localScript]);
  const handleMouseMove = (e) => {
    const x = e.clientX / window.innerWidth * 100;
    const y = e.clientY / window.innerHeight * 100;
    setMousePosition({ x, y });
  };
  const actorsAtIndex = useMemo2(() => getPresentActors(localScript, index), [localScript, index, actors, getPresentActors]);
  const speakerActor = useMemo2(() => {
    return localScript.script[index] && localScript.script[index].speakerId ? actors[localScript.script[index].speakerId] : null;
  }, [localScript, index, actors]);
  const displayMessage = useMemo2(() => {
    const message = localScript.script[index]?.message || "";
    return formatMessage(message, speakerActor, messageTokens);
  }, [localScript, index, speakerActor, messageTokens]);
  useEffect3(() => {
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
      if (audioEnabled && localScript.script[index]?.speechUrl) {
        const audio = new Audio(localScript.script[index].speechUrl);
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
    setMessageKey(messageKey + 1);
  }, [index]);
  useEffect3(() => {
    if (!mousePosition) {
      setHoveredActor(null);
      return;
    }
    if (mousePosition.y > messageBoxTopVh) {
      setHoveredActor(null);
      return;
    }
    if (actorsAtIndex.length === 0 && !(enableGhostSpeakers && speakerActor)) {
      setHoveredActor(null);
      return;
    }
    const actorPositions = actorsAtIndex.map((actor, i) => ({
      actor,
      xPosition: calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor))
    }));
    if (enableGhostSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
      const ghostSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? "left" : "right";
      actorPositions.push({
        actor: speakerActor,
        xPosition: ghostSide === "left" ? 10 : 90
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
  }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor, enableGhostSpeakers]);
  useEffect3(() => {
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
  }, [inputText, index, localScript, finishTyping, loading, isEditingMessage]);
  const next = () => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (finishTyping) {
      setIndex(Math.min(localScript.script.length - 1, index + 1));
    } else if (allowTypingSkip) {
      setFinishTyping(true);
    }
  };
  const prev = () => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    setIndex(Math.max(0, index - 1));
  };
  const handleEnterEditMode = () => {
    const currentMessage = localScript.script[index]?.message || "";
    setOriginalMessage(currentMessage);
    setEditedMessage(currentMessage);
    setIsEditingMessage(true);
  };
  const handleConfirmEdit = () => {
    const currentMessage = localScript.script[index]?.message || "";
    if (editedMessage === currentMessage) {
      setIsEditingMessage(false);
      setOriginalMessage("");
      return;
    }
    if (onUpdateMessage) {
      onUpdateMessage(index, editedMessage);
    } else {
      const updated = { ...localScript };
      if (updated.script[index]) {
        updated.script[index] = { ...updated.script[index], message: editedMessage };
      }
      setLocalScript(updated);
    }
    setIsEditingMessage(false);
    setOriginalMessage("");
  };
  const handleCancelEdit = () => {
    setEditedMessage(originalMessage);
    setIsEditingMessage(false);
    setOriginalMessage("");
  };
  const sceneEnded = Boolean(localScript.script[index]?.endScene);
  const progressLabel = `${localScript.script.length === 0 ? 0 : index + 1} / ${localScript.script.length}`;
  const placeholderText = useMemo2(() => {
    if (typeof inputPlaceholder === "function") {
      return inputPlaceholder({ index, entry: localScript.script[index] });
    }
    if (inputPlaceholder) return inputPlaceholder;
    if (sceneEnded) return "Scene concluded";
    if (loading) return "Loading...";
    return "Type your next action...";
  }, [inputPlaceholder, index, localScript, sceneEnded, loading]);
  const renderNameplateNode = () => {
    if (renderNameplate)
      return renderNameplate({ actor: speakerActor });
    return /* @__PURE__ */ jsx5(
      Typography,
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
    const actorElements = actorsAtIndex.map((actor, i) => {
      const xPosition = calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
      const isSpeaking = actor === speakerActor;
      const isHovered = actor === hoveredActor;
      const imageUrl = getActorImageUrl(actor, localScript, index);
      const yPosition = isVerticalLayout ? 20 : 0;
      const zIndex = 50 - Math.abs(xPosition - 50);
      return /* @__PURE__ */ jsx5(
        ActorImage_default,
        {
          id: actor.id,
          resolveImageUrl: () => {
            return getActorImageUrl(actor, localScript, index);
          },
          xPosition,
          yPosition,
          zIndex,
          heightMultiplier: isVerticalLayout ? isSpeaking ? 0.9 : 0.7 : 1,
          speaker: isSpeaking,
          highlightColor: isHovered ? "rgba(255,255,255,1)" : "rgba(225,225,225,1)",
          isAudioPlaying: isSpeaking && isAudioPlaying && enableTalkingAnimation
        },
        actor.id
      );
    });
    if (enableGhostSpeakers && speakerActor && !actorsAtIndex.includes(speakerActor)) {
      const yPosition = isVerticalLayout ? 20 : 0;
      const isHovered = speakerActor === hoveredActor;
      const ghostSide = speakerActor.id.charCodeAt(0) % 2 === 0 ? "left" : "right";
      actorElements.push(
        /* @__PURE__ */ jsx5(
          ActorImage_default,
          {
            id: `ghost-${speakerActor.id}`,
            resolveImageUrl: () => {
              return getActorImageUrl(speakerActor, localScript, index);
            },
            xPosition: ghostSide === "left" ? 10 : 90,
            yPosition,
            zIndex: 45,
            heightMultiplier: isVerticalLayout ? 0.65 : 0.85,
            speaker: true,
            highlightColor: isHovered ? "rgba(255,255,255,1)" : "rgba(200,200,200,0.9)",
            isGhost: true,
            ghostSide,
            isAudioPlaying: isAudioPlaying && enableTalkingAnimation
          },
          `ghost-${speakerActor.id}`
        )
      );
    }
    return actorElements;
  };
  const handleSubmit = () => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (!inputText.trim() && index < localScript.script.length - 1) {
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
      setIndex(localScript.script.length - 1);
      atIndex = localScript.script.length - 1;
    }
    if (onSubmitInput) {
      setLoading(true);
      const tempScript = { ...localScript };
      onSubmitInput(inputText, tempScript, atIndex).then((newScript) => {
        setLoading(false);
        if (newScript.id !== tempScript.id) {
          console.log("New script detected.");
          setIndex(0);
        } else {
          setIndex(Math.min(newScript.script.length - 1, atIndex + 1));
        }
        setLocalScript({ ...newScript });
      }).catch((error) => {
        console.log("Submission failed", error);
        setLoading(false);
      });
    }
    setInputText("");
  };
  const handleReroll = () => {
    const rerollIndex = index;
    const tempScript = { ...localScript, script: localScript.script.slice(0, rerollIndex) };
    console.log("Reroll clicked");
    if (onSubmitInput) {
      setLoading(true);
      console.log("Rerolling");
      onSubmitInput(inputText, tempScript, rerollIndex).then((newScript) => {
        console.log("Reroll complete");
        setLoading(false);
        setIndex(rerollIndex);
        setLocalScript({ ...newScript });
      }).catch((error) => {
        console.log("Reroll failed", error);
        setLoading(false);
      });
    }
  };
  const hoverInfoNode = renderActorHoverInfo ? renderActorHoverInfo(hoveredActor) : null;
  const backgroundImageUrl = useMemo2(
    () => getBackgroundImageUrl(localScript, index),
    [getBackgroundImageUrl, localScript, index]
  );
  return /* @__PURE__ */ jsx5(
    BlurredBackground,
    {
      imageUrl: backgroundImageUrl,
      brightness: backgroundOptions?.brightness,
      contrast: backgroundOptions?.contrast,
      blur: backgroundOptions?.blur,
      scale: backgroundOptions?.scale,
      overlay: backgroundOptions?.overlay,
      transitionDuration: backgroundOptions?.transitionDuration,
      children: /* @__PURE__ */ jsxs3(
        "div",
        {
          style: { position: "relative", width: "100vw", height: "100vh" },
          onMouseMove: handleMouseMove,
          onMouseLeave: () => setMousePosition(null),
          children: [
            /* @__PURE__ */ jsx5("div", { style: { position: "absolute", inset: 0, zIndex: 1 }, children: renderActors() }),
            hoverInfoNode && /* @__PURE__ */ jsx5(
              "div",
              {
                style: {
                  position: "absolute",
                  top: isVerticalLayout ? "2%" : "5%",
                  right: isVerticalLayout ? "2%" : "5%",
                  width: isVerticalLayout ? "35vw" : "15vw",
                  height: "30vh",
                  zIndex: 3
                },
                children: hoverInfoNode
              }
            ),
            /* @__PURE__ */ jsxs3(
              Paper,
              {
                ref: messageBoxRef,
                elevation: 8,
                sx: {
                  position: "absolute",
                  left: isVerticalLayout ? "2%" : "5%",
                  right: isVerticalLayout ? "2%" : "5%",
                  bottom: isVerticalLayout ? "1%" : "4%",
                  background: alpha(theme.palette.background.paper, 0.92),
                  border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: 3,
                  p: 2,
                  color: theme.palette.text.primary,
                  zIndex: 2,
                  backdropFilter: "blur(8px)",
                  minHeight: isVerticalLayout ? "20vh" : void 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                },
                children: [
                  /* @__PURE__ */ jsxs3(Box, { sx: { display: "flex", alignItems: "center", mb: isVerticalLayout ? 1 : 2 }, children: [
                    /* @__PURE__ */ jsxs3(Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "center", flex: 1 }, children: [
                      /* @__PURE__ */ jsx5(
                        IconButton,
                        {
                          onClick: prev,
                          disabled: index === 0 || loading,
                          size: "small",
                          sx: {
                            color: theme.palette.text.secondary,
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ jsx5(ChevronLeft, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "14px" : void 0 } })
                        }
                      ),
                      /* @__PURE__ */ jsx5(
                        Chip,
                        {
                          label: loading ? /* @__PURE__ */ jsx5(CircularProgress, { size: isVerticalLayout ? 12 : 16, sx: { color: theme.palette.primary.light } }) : /* @__PURE__ */ jsx5("span", { style: { display: "flex", alignItems: "center", gap: isVerticalLayout ? "2px" : "4px" }, children: progressLabel }),
                          sx: {
                            minWidth: isVerticalLayout ? 50 : 72,
                            height: isVerticalLayout ? "24px" : void 0,
                            fontSize: isVerticalLayout ? "0.7rem" : void 0,
                            fontWeight: 700,
                            color: theme.palette.primary.light,
                            background: alpha(theme.palette.action.hover, 0.5),
                            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
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
                      /* @__PURE__ */ jsx5(
                        IconButton,
                        {
                          onClick: next,
                          disabled: index >= localScript.script.length - 1 || loading,
                          size: "small",
                          sx: {
                            color: theme.palette.text.secondary,
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ jsx5(ChevronRight, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "14px" : void 0 } })
                        }
                      ),
                      renderNameplateNode()
                    ] }),
                    !hideActionButtons && /* @__PURE__ */ jsxs3(Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "center" }, children: [
                      !isEditingMessage ? /* @__PURE__ */ jsx5(
                        IconButton,
                        {
                          onClick: handleEnterEditMode,
                          disabled: loading,
                          size: "small",
                          sx: {
                            color: accentMain,
                            border: `1px solid ${alpha(accentMain, 0.25)}`,
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
                              borderColor: alpha(accentMain, 0.4),
                              color: accentLight
                            },
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ jsx5(Edit, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                        }
                      ) : /* @__PURE__ */ jsxs3(Fragment3, { children: [
                        /* @__PURE__ */ jsx5(
                          IconButton,
                          {
                            onClick: handleConfirmEdit,
                            size: "small",
                            sx: {
                              color: accentMain,
                              border: `1px solid ${alpha(accentMain, 0.25)}`,
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
                                borderColor: alpha(accentMain, 0.4),
                                color: accentLight
                              }
                            },
                            children: /* @__PURE__ */ jsx5(Check, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                          }
                        ),
                        /* @__PURE__ */ jsx5(
                          IconButton,
                          {
                            onClick: handleCancelEdit,
                            size: "small",
                            sx: {
                              color: errorMain,
                              border: `1px solid ${alpha(errorMain, 0.25)}`,
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
                                borderColor: alpha(errorMain, 0.4),
                                color: errorLight
                              }
                            },
                            children: /* @__PURE__ */ jsx5(Clear, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                          }
                        )
                      ] }),
                      enableReroll && /* @__PURE__ */ jsx5(
                        IconButton,
                        {
                          onClick: handleReroll,
                          disabled: loading,
                          size: "small",
                          sx: {
                            color: accentMain,
                            border: `1px solid ${alpha(accentMain, 0.25)}`,
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              borderColor: alpha(accentMain, 0.4),
                              color: accentLight,
                              transform: "rotate(180deg)"
                            },
                            "&:disabled": { color: theme.palette.text.disabled }
                          },
                          children: /* @__PURE__ */ jsx5(Casino, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx5(
                    Box,
                    {
                      sx: {
                        minHeight: "4rem",
                        cursor: isEditingMessage ? "text" : "pointer",
                        borderRadius: 1,
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor: isEditingMessage ? "transparent" : theme.palette.action.hover
                        }
                      },
                      onClick: () => {
                        if (!isEditingMessage && !loading) {
                          if (!finishTyping) {
                            setFinishTyping(true);
                          } else if (allowTypingSkip) {
                            next();
                          }
                        }
                      },
                      children: isEditingMessage ? /* @__PURE__ */ jsx5(
                        TextField,
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
                              backgroundColor: alpha(theme.palette.action.selected, 0.5),
                              padding: "8px"
                            },
                            "& .MuiInputBase-input": {
                              padding: 0
                            }
                          }
                        }
                      ) : /* @__PURE__ */ jsx5(
                        Typography,
                        {
                          variant: "body1",
                          sx: {
                            fontSize: isVerticalLayout ? "clamp(0.75rem, 2vw, 1.18rem)" : "1.18rem",
                            lineHeight: 1.55,
                            fontFamily: theme.typography.fontFamily,
                            color: theme.palette.text.primary,
                            textShadow: baseTextShadow
                          },
                          children: localScript.script.length > 0 ? /* @__PURE__ */ jsx5(
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
                  !hideInput && /* @__PURE__ */ jsxs3(Box, { sx: { display: "flex", gap: isVerticalLayout ? 0.5 : 1.5, alignItems: "center" }, children: [
                    /* @__PURE__ */ jsx5(
                      TextField,
                      {
                        fullWidth: true,
                        value: inputText,
                        onChange: (e) => setInputText(e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!loading) {
                              handleSubmit();
                            }
                          }
                        },
                        placeholder: placeholderText,
                        disabled: loading,
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
                              borderColor: alpha(theme.palette.divider, 0.8)
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: accentMain
                            },
                            "&.Mui-disabled": {
                              color: theme.palette.text.disabled,
                              "& fieldset": {
                                borderColor: alpha(theme.palette.divider, 0.5)
                              }
                            }
                          },
                          "& .MuiInputBase-input": {
                            padding: isVerticalLayout ? "6px 8px" : void 0
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: alpha(theme.palette.text.primary, 0.55),
                            opacity: 1,
                            fontSize: isVerticalLayout ? "0.75rem" : void 0
                          },
                          "& .MuiInputBase-input.Mui-disabled::placeholder": {
                            color: alpha(theme.palette.text.primary, 0.4),
                            opacity: 1
                          },
                          "& .MuiInputBase-input.Mui-disabled": {
                            color: alpha(theme.palette.text.primary, 0.45),
                            WebkitTextFillColor: alpha(theme.palette.text.primary, 0.45)
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx5(
                      Button,
                      {
                        onClick: handleSubmit,
                        disabled: loading,
                        variant: "contained",
                        startIcon: (() => {
                          if (getSubmitButtonConfig) {
                            const config = getSubmitButtonConfig(localScript, index, inputText);
                            return config.icon;
                          }
                          if (sceneEnded && !inputText.trim()) {
                            return /* @__PURE__ */ jsx5(Close, { fontSize: isVerticalLayout ? "small" : void 0 });
                          }
                          return inputText.trim() ? /* @__PURE__ */ jsx5(Send, { fontSize: isVerticalLayout ? "small" : void 0 }) : /* @__PURE__ */ jsx5(Forward, { fontSize: isVerticalLayout ? "small" : void 0 });
                        })(),
                        sx: {
                          background: (() => {
                            const colorScheme = getSubmitButtonConfig ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : sceneEnded && !inputText.trim() ? "error" : "primary";
                            const baseColor = colorScheme === "error" ? errorMain : accentMain;
                            return `linear-gradient(90deg, ${lighten(baseColor, 0.12)}, ${darken(baseColor, 0.2)})`;
                          })(),
                          color: (() => {
                            const colorScheme = getSubmitButtonConfig ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : sceneEnded && !inputText.trim() ? "error" : "primary";
                            const baseColor = colorScheme === "error" ? errorMain : accentMain;
                            return theme.palette.getContrastText(baseColor);
                          })(),
                          fontWeight: 800,
                          fontSize: isVerticalLayout ? "clamp(0.6rem, 2vw, 0.875rem)" : void 0,
                          padding: isVerticalLayout ? "4px 10px" : void 0,
                          whiteSpace: "nowrap",
                          "&:hover": {
                            background: (() => {
                              const colorScheme = getSubmitButtonConfig ? getSubmitButtonConfig(localScript, index, inputText).colorScheme : sceneEnded && !inputText.trim() ? "error" : "primary";
                              const baseColor = colorScheme === "error" ? errorMain : accentMain;
                              return `linear-gradient(90deg, ${lighten(baseColor, 0.2)}, ${darken(baseColor, 0.28)})`;
                            })()
                          },
                          "&:disabled": {
                            background: theme.palette.action.disabledBackground,
                            color: theme.palette.text.disabled
                          }
                        },
                        children: (() => {
                          if (getSubmitButtonConfig) {
                            return getSubmitButtonConfig(localScript, index, inputText).label;
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
export {
  ActorImage_default as ActorImage,
  BlurredBackground_default as BlurredBackground,
  NovelVisualizer_default as NovelVisualizer,
  TypeOut_default as TypeOut
};
