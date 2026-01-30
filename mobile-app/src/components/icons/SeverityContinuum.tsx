import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const SeverityContinuum: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  accent = "#B89A5A",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line
      x1="20"
      y1="50"
      x2="80"
      y2="50"
      stroke={muted}
      strokeWidth={stroke}
      strokeLinecap="round"
    />
    <Line
      x1="20"
      y1="45"
      x2="20"
      y2="55"
      stroke={muted}
      strokeWidth={stroke}
      strokeLinecap="round"
    />
    <Line
      x1="80"
      y1="45"
      x2="80"
      y2="55"
      stroke={muted}
      strokeWidth={stroke}
      strokeLinecap="round"
    />
    <Circle cx="56" cy="50" r="4" fill={accent} />
  </Svg>
);
