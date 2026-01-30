import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const VeinDivider: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 30 50 Q 40 48 50 50 Q 60 52 70 50"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 50 50 Q 52 42 54 35"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);