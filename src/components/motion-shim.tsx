import type { HTMLAttributes } from "react";

type MotionExtras = {
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
};

type MotionProps<T extends HTMLElement> = HTMLAttributes<T> & MotionExtras;

function stripMotionProps<T extends HTMLElement>(props: MotionProps<T>) {
  const domProps = { ...props };
  delete domProps.initial;
  delete domProps.animate;
  delete domProps.transition;
  delete domProps.whileHover;
  delete domProps.whileTap;
  return domProps;
}

function MotionDiv(props: MotionProps<HTMLDivElement>) {
  return <div {...stripMotionProps(props)} />;
}

function MotionH1(props: MotionProps<HTMLHeadingElement>) {
  return <h1 {...stripMotionProps(props)} />;
}

function MotionP(props: MotionProps<HTMLParagraphElement>) {
  return <p {...stripMotionProps(props)} />;
}

export const motion = {
  div: MotionDiv,
  h1: MotionH1,
  p: MotionP,
};
