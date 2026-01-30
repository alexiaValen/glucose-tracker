import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const RangeBracket: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 30 35 L 30 50 Q 30 55 32 58 L 32 65"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 70 35 L 70 50 Q 70 55 68 58 L 68 65"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);