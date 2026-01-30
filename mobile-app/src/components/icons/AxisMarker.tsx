import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

type AxisMarkerProps = IconProps & {
  position?: "top" | "mid" | "bot";
};

export const AxisMarker: React.FC<AxisMarkerProps> = ({
  size = 24,
  color = "#2B2B2B",
  accent = "#B89A5A",
  stroke = 1.5,
  position = "mid",
}) => {
  const dotY = position === "top" ? 25 : position === "bot" ? 75 : 50;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Line
        x1="50"
        y1="20"
        x2="50"
        y2="80"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Circle cx="50" cy={dotY} r="3" fill={accent} />
    </Svg>
  );
};
