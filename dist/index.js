// src/components/NovelVisualizer.tsx
import { useEffect as useEffect2, useMemo as useMemo2, useRef as useRef2, useState as useState2 } from "react";
import { Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, Edit, Check, Clear, Send, Forward, Close, Casino, CardGiftcard } from "@mui/icons-material";

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
  onMouseLeave
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
  const variants = useMemo(() => ({
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
  }), [baseX, baseY, yPosition, zIndex, heightMultiplier]);
  return processedImageUrl ? /* @__PURE__ */ jsxs(
    motion.div,
    {
      variants,
      initial: "absent",
      exit: "absent",
      animate: speaker ? "talking" : "idle",
      style: { position: "absolute", width: "auto", aspectRatio, overflow: "visible", zIndex: speaker ? 100 : zIndex },
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
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var BlurredBackground = ({
  imageUrl,
  brightness = 0.6,
  contrast = 1.05,
  blur = 6,
  scale = 1.03,
  overlay,
  children
}) => {
  return /* @__PURE__ */ jsxs2("div", { style: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsx2("div", { style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
      transform: `scale(${scale})`
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
import React from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var extractTextContent = (node) => {
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (React.isValidElement(node)) {
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
    if (React.isValidElement(n)) {
      const children = n.props.children;
      if (children !== void 0 && children !== null) {
        const truncatedChildren = truncateNode(children);
        if (truncatedChildren !== null || !children) {
          return React.cloneElement(n, { ...n.props, key }, truncatedChildren);
        }
        return null;
      }
      return React.cloneElement(n, { ...n.props, key });
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
  const [displayLength, setDisplayLength] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const timerRef = React.useRef(null);
  const textContent = React.useMemo(() => extractTextContent(children), [children]);
  const prevTextContentRef = React.useRef("");
  const onTypingCompleteRef = React.useRef(onTypingComplete);
  React.useEffect(() => {
    onTypingCompleteRef.current = onTypingComplete;
  }, [onTypingComplete]);
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  const displayContent = React.useMemo(() => {
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
function formatInlineStyles(text) {
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
}

// src/components/NovelVisualizer.tsx
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var baseTextShadow = "2px 2px 2px rgba(0, 0, 0, 0.8)";
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
var formatMessage = (text, speakerActor) => {
  if (!text) return /* @__PURE__ */ jsx5(Fragment3, {});
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const dialogueParts = text.split(/(\"[^\"]*\")/g);
  return /* @__PURE__ */ jsx5(Fragment3, { children: dialogueParts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      const brightenedColor = speakerActor?.themeColor ? adjustColor(speakerActor.themeColor, 0.6) : "#87CEEB";
      const dialogueStyle = {
        color: brightenedColor,
        fontFamily: speakerActor?.themeFontFamily || void 0,
        textShadow: speakerActor?.themeColor ? `2px 2px 2px ${adjustColor(speakerActor.themeColor, -0.25)}` : "2px 2px 2px rgba(135, 206, 235, 0.5)"
      };
      return /* @__PURE__ */ jsx5("span", { style: dialogueStyle, children: formatInlineStyles(part) }, index);
    }
    return /* @__PURE__ */ jsx5("span", { style: { textShadow: baseTextShadow }, children: formatInlineStyles(part) }, index);
  }) });
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
  const {
    script,
    actors,
    backgroundImageUrl,
    isVerticalLayout = false,
    loading = false,
    typingSpeed = 20,
    allowTypingSkip = true,
    onSubmitInput,
    onUpdateMessage,
    onReroll,
    onWrapUp,
    onClose,
    inputPlaceholder,
    renderNameplate,
    renderActorHoverInfo,
    getActorImageUrl,
    getPresentActors,
    resolveSpeaker,
    backgroundOptions,
    hideInput = false,
    hideActionButtons = false
  } = props;
  const [inputText, setInputText] = useState2("");
  const [finishTyping, setFinishTyping] = useState2(false);
  const [messageKey, setMessageKey] = useState2(0);
  const [hoveredActor, setHoveredActor] = useState2(null);
  const [mousePosition, setMousePosition] = useState2(null);
  const [messageBoxTopVh, setMessageBoxTopVh] = useState2(isVerticalLayout ? 50 : 60);
  const messageBoxRef = useRef2(null);
  const [isEditingMessage, setIsEditingMessage] = useState2(false);
  const [editedMessage, setEditedMessage] = useState2("");
  const [originalMessage, setOriginalMessage] = useState2("");
  const [localScript, setLocalScript] = useState2(script);
  const [index, setIndex] = useState2(0);
  const prevIndexRef = useRef2(index);
  const activeScript = onUpdateMessage ? script : localScript;
  const entries = activeScript.script || [];
  useEffect2(() => {
    setLocalScript(script);
  }, [script]);
  useEffect2(() => {
    if (messageBoxRef.current) {
      const rect = messageBoxRef.current.getBoundingClientRect();
      const topVh = rect.top / window.innerHeight * 100;
      setMessageBoxTopVh(topVh);
    }
  }, [isVerticalLayout, activeScript]);
  const handleMouseMove = (e) => {
    const x = e.clientX / window.innerWidth * 100;
    const y = e.clientY / window.innerHeight * 100;
    setMousePosition({ x, y });
  };
  const actorsAtIndex = useMemo2(() => getPresentActors(activeScript, index), [activeScript, index, actors, getPresentActors]);
  const speakerActor = useMemo2(() => {
    if (resolveSpeaker) return resolveSpeaker(script, index);
    return null;
  }, [entries, index, actors, resolveSpeaker]);
  const displayMessage = useMemo2(() => {
    const message = entries[index]?.message || "";
    return formatMessage(message, speakerActor);
  }, [entries, index, speakerActor]);
  useEffect2(() => {
    if (prevIndexRef.current !== index) {
      setFinishTyping(false);
      if (isEditingMessage) {
        setIsEditingMessage(false);
        setOriginalMessage("");
      }
      prevIndexRef.current = index;
    }
    setMessageKey((prev2) => prev2 + 1);
  }, [index]);
  useEffect2(() => {
    if (!mousePosition) {
      setHoveredActor(null);
      return;
    }
    if (mousePosition.y > messageBoxTopVh) {
      setHoveredActor(null);
      return;
    }
    if (actorsAtIndex.length === 0) {
      setHoveredActor(null);
      return;
    }
    const actorPositions = actorsAtIndex.map((actor, i) => ({
      actor,
      xPosition: calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor))
    }));
    const HOVER_RANGE = 10;
    let closestActor = null;
    let closestDistance = Infinity;
    actorPositions.forEach(({ actor, xPosition }) => {
      const distance = Math.abs(mousePosition.x - (actor === speakerActor ? 50 : xPosition));
      if (distance < closestDistance && distance <= HOVER_RANGE) {
        closestDistance = distance;
        closestActor = actor;
      }
    });
    setHoveredActor(closestActor);
  }, [mousePosition, messageBoxTopVh, actorsAtIndex, speakerActor]);
  useEffect2(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "ArrowLeft" && (!isInputFocused || inputText.trim() === "")) {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight" && (!isInputFocused || inputText.trim() === "")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputText, index, entries.length, finishTyping, loading]);
  const next = () => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (finishTyping) {
      setIndex(index + 1);
    } else if (allowTypingSkip) {
      setFinishTyping(true);
    }
  };
  const prev = () => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    setIndex(index - 1);
  };
  const handleEnterEditMode = () => {
    const currentMessage = entries[index]?.message || "";
    setOriginalMessage(currentMessage);
    setEditedMessage(currentMessage);
    setIsEditingMessage(true);
  };
  const handleConfirmEdit = () => {
    const currentMessage = entries[index]?.message || "";
    if (editedMessage === currentMessage) {
      setIsEditingMessage(false);
      setOriginalMessage("");
      return;
    }
    if (onUpdateMessage) {
      onUpdateMessage(index, editedMessage);
    } else {
      const updated = { ...activeScript, script: [...entries] };
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
  const sceneEnded = Boolean(entries[index]?.endScene);
  const progressLabel = `${entries.length === 0 ? 0 : index + 1} / ${entries.length}`;
  const placeholderText = useMemo2(() => {
    if (typeof inputPlaceholder === "function") {
      return inputPlaceholder({ index, entry: entries[index] });
    }
    if (inputPlaceholder) return inputPlaceholder;
    if (sceneEnded) return "Scene concluded";
    if (loading) return "Processing...";
    return "Type your next action...";
  }, [inputPlaceholder, index, entries, sceneEnded, loading]);
  const renderNameplateNode = () => {
    if (renderNameplate)
      return renderNameplate({ actor: speakerActor });
    return /* @__PURE__ */ jsx5(
      Typography,
      {
        sx: {
          fontWeight: 700,
          color: "#bfffd0",
          fontSize: isVerticalLayout ? "0.85rem" : "1rem",
          textShadow: baseTextShadow
        },
        children: speakerActor ? speakerActor.name : "Narrator"
      }
    );
  };
  const renderActors = () => {
    return actorsAtIndex.map((actor, i) => {
      const xPosition = calculateActorXPosition(i, actorsAtIndex.length, Boolean(speakerActor));
      const isSpeaking = actor === speakerActor;
      const isHovered = actor === hoveredActor;
      const imageUrl = getActorImageUrl(actor, activeScript, index);
      const yPosition = isVerticalLayout ? 20 : 0;
      const zIndex = 50 - Math.abs(xPosition - 50);
      return /* @__PURE__ */ jsx5(
        ActorImage_default,
        {
          id: actor.id,
          resolveImageUrl: () => {
            return getActorImageUrl(actor, activeScript, index);
          },
          xPosition,
          yPosition,
          zIndex,
          heightMultiplier: isVerticalLayout ? isSpeaking ? 0.9 : 0.7 : 1,
          speaker: isSpeaking,
          highlightColor: isHovered ? "rgba(255,255,255,1)" : "rgba(225,225,225,1)",
          panX: 0,
          panY: 0
        },
        actor.id
      );
    });
  };
  const handleSubmit = (wrapUp = false) => {
    if (isEditingMessage) {
      handleConfirmEdit();
    }
    if (!inputText.trim() && index < entries.length - 1) {
      next();
      return;
    }
    onSubmitInput?.(inputText, { index, entry: entries[index], wrapUp });
    setInputText("");
  };
  const handleWrapUp = () => {
    if (onWrapUp) {
      onWrapUp(index);
      return;
    }
    handleSubmit(true);
  };
  const hoverInfoNode = renderActorHoverInfo ? renderActorHoverInfo(hoveredActor) : null;
  return /* @__PURE__ */ jsx5(
    BlurredBackground,
    {
      imageUrl: backgroundImageUrl,
      brightness: backgroundOptions?.brightness,
      contrast: backgroundOptions?.contrast,
      blur: backgroundOptions?.blur,
      scale: backgroundOptions?.scale,
      overlay: backgroundOptions?.overlay,
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
                  background: "rgba(10,20,30,0.95)",
                  border: "2px solid rgba(0,255,136,0.12)",
                  borderRadius: 3,
                  p: 2,
                  color: "#e8fff0",
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
                            color: "#cfe",
                            border: "1px solid rgba(255,255,255,0.08)",
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: "rgba(255,255,255,0.3)" }
                          },
                          children: /* @__PURE__ */ jsx5(ChevronLeft, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "14px" : void 0 } })
                        }
                      ),
                      /* @__PURE__ */ jsx5(
                        Chip,
                        {
                          label: loading ? /* @__PURE__ */ jsx5(CircularProgress, { size: isVerticalLayout ? 12 : 16, sx: { color: "#bfffd0" } }) : /* @__PURE__ */ jsx5("span", { style: { display: "flex", alignItems: "center", gap: isVerticalLayout ? "2px" : "4px" }, children: progressLabel }),
                          sx: {
                            minWidth: isVerticalLayout ? 50 : 72,
                            height: isVerticalLayout ? "24px" : void 0,
                            fontSize: isVerticalLayout ? "0.7rem" : void 0,
                            fontWeight: 700,
                            color: "#bfffd0",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.03)",
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
                          disabled: index >= entries.length - 1 || loading,
                          size: "small",
                          sx: {
                            color: "#cfe",
                            border: "1px solid rgba(255,255,255,0.08)",
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            "&:disabled": { color: "rgba(255,255,255,0.3)" }
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
                            color: "#00ff88",
                            border: "1px solid rgba(0,255,136,0.2)",
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
                              borderColor: "rgba(0,255,136,0.4)",
                              color: "#00ffaa"
                            },
                            "&:disabled": { color: "rgba(255,255,255,0.3)" }
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
                              color: "#00ff88",
                              border: "1px solid rgba(0,255,136,0.2)",
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
                                borderColor: "rgba(0,255,136,0.4)",
                                color: "#00ffaa"
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
                              color: "#ff6b6b",
                              border: "1px solid rgba(255,107,107,0.2)",
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
                                borderColor: "rgba(255,107,107,0.4)",
                                color: "#ff5252"
                              }
                            },
                            children: /* @__PURE__ */ jsx5(Clear, { fontSize: isVerticalLayout ? "inherit" : "small", sx: { fontSize: isVerticalLayout ? "16px" : void 0 } })
                          }
                        )
                      ] }),
                      onReroll && /* @__PURE__ */ jsx5(
                        IconButton,
                        {
                          onClick: () => onReroll(index),
                          disabled: loading,
                          size: "small",
                          sx: {
                            color: "#00ff88",
                            border: "1px solid rgba(0,255,136,0.2)",
                            padding: isVerticalLayout ? "4px" : void 0,
                            minWidth: isVerticalLayout ? "28px" : void 0,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              borderColor: "rgba(0,255,136,0.4)",
                              color: "#00ffaa",
                              transform: "rotate(180deg)"
                            },
                            "&:disabled": { color: "rgba(255,255,255,0.3)" }
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
                          backgroundColor: isEditingMessage ? "transparent" : "rgba(255,255,255,0.02)"
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
                              fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                              color: "#e9fff7",
                              backgroundColor: "rgba(255,255,255,0.05)",
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
                            fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                            color: "#e9fff7",
                            textShadow: baseTextShadow
                          },
                          children: entries.length > 0 ? /* @__PURE__ */ jsx5(
                            TypeOut_default,
                            {
                              speed: typingSpeed,
                              finishTyping,
                              onTypingComplete: () => setFinishTyping(true),
                              children: displayMessage
                            },
                            messageKey
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
                              if (sceneEnded && inputText.trim() === "") {
                                onClose?.();
                              } else {
                                handleSubmit(false);
                              }
                            }
                          }
                        },
                        placeholder: placeholderText,
                        disabled: loading,
                        variant: "outlined",
                        size: "small",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                            color: "#eafff2",
                            fontSize: isVerticalLayout ? "0.75rem" : void 0,
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.08)"
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.12)"
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgba(0,255,136,0.3)"
                            },
                            "&.Mui-disabled": {
                              color: "rgba(255,255,255,0.6)",
                              "& fieldset": {
                                borderColor: "rgba(255,255,255,0.04)"
                              }
                            }
                          },
                          "& .MuiInputBase-input": {
                            padding: isVerticalLayout ? "6px 8px" : void 0
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: "rgba(255,255,255,0.5)",
                            opacity: 1,
                            fontSize: isVerticalLayout ? "0.75rem" : void 0
                          },
                          "& .MuiInputBase-input.Mui-disabled::placeholder": {
                            color: "rgba(255,255,255,0.4)",
                            opacity: 1
                          },
                          "& .MuiInputBase-input.Mui-disabled": {
                            color: "rgba(255,255,255,0.45)",
                            WebkitTextFillColor: "rgba(255,255,255,0.45)"
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx5(
                      Button,
                      {
                        onClick: () => {
                          if (sceneEnded && !inputText.trim()) {
                            onClose?.();
                          } else {
                            handleSubmit(false);
                          }
                        },
                        disabled: loading,
                        variant: "contained",
                        startIcon: sceneEnded && !inputText.trim() ? /* @__PURE__ */ jsx5(Close, { fontSize: isVerticalLayout ? "small" : void 0 }) : inputText.trim() ? /* @__PURE__ */ jsx5(Send, { fontSize: isVerticalLayout ? "small" : void 0 }) : /* @__PURE__ */ jsx5(Forward, { fontSize: isVerticalLayout ? "small" : void 0 }),
                        sx: {
                          background: sceneEnded && !inputText.trim() ? "linear-gradient(90deg,#ff8c66,#ff5a3b)" : "linear-gradient(90deg,#00ff88,#00b38f)",
                          color: sceneEnded && !inputText.trim() ? "#fff" : "#00221a",
                          fontWeight: 800,
                          minWidth: isVerticalLayout ? 76 : 100,
                          fontSize: isVerticalLayout ? "clamp(0.6rem, 2vw, 0.875rem)" : void 0,
                          padding: isVerticalLayout ? "4px 10px" : void 0,
                          "&:hover": {
                            background: sceneEnded && !inputText.trim() ? "linear-gradient(90deg,#ff7a52,#ff4621)" : "linear-gradient(90deg,#00e67a,#009a7b)"
                          },
                          "&:disabled": {
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.3)"
                          }
                        },
                        children: sceneEnded && !inputText.trim() ? "End" : inputText.trim() ? "Send" : "Continue"
                      }
                    ),
                    onWrapUp && /* @__PURE__ */ jsx5(
                      IconButton,
                      {
                        onClick: handleWrapUp,
                        disabled: loading,
                        sx: {
                          background: "linear-gradient(90deg,#00ff88,#00b38f)",
                          color: "#00221a",
                          padding: isVerticalLayout ? "4px" : "6px",
                          borderRadius: "4px",
                          "&:hover": {
                            background: "linear-gradient(90deg,#00e67a,#009a7b)"
                          },
                          "&:disabled": {
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.3)"
                          }
                        },
                        children: /* @__PURE__ */ jsx5(CardGiftcard, { fontSize: isVerticalLayout ? "small" : "medium" })
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
