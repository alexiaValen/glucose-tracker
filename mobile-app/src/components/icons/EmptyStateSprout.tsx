import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const EmptyStateSprout: React.FC<IconProps> = ({
  size = 24,
  color = "#2B2B2B",
  muted = "#CFC9BF",
  accent = "#B89A5A",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 50 20 A 30 30 0 1 1 68 68"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
      opacity="0.4"
    />
    <Line
      x1="50"
      y1="35"
      x2="50"
      y2="70"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
    />
    <Path
      d="M 50 48 Q 42 45 38 42"
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 50 55 Q 58 52 62 49"
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 50 62 Q 56 60 60 58"
      stroke={accent}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);