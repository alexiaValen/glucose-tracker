import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const InsightUnderline: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  accent = "#B89A5A",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 20 60 L 55 60"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 55 60 L 80 60"
      stroke={accent}
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);
