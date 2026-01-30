import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

type ChipIndicatorTickProps = IconProps & {
  selected?: boolean;
};

export const ChipIndicatorTick: React.FC<ChipIndicatorTickProps> = ({
  size = 24,
  color = "#2B2B2B",
  muted = "#CFC9BF",
  accent = "#B89A5A",
  stroke = 1.5,
  selected = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 35 50 L 45 60 L 65 40"
      stroke={selected ? color : muted}
      strokeWidth={selected ? 2.5 : stroke}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {selected && <Circle cx="62" cy="32" r="3" fill={accent} />}
  </Svg>
);
