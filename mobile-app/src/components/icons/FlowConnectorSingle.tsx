import React from "react";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export const FlowConnectorSingle: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  accent = "#B89A5A",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 20 20 Q 35 35 50 50"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 50 50 Q 65 65 80 80"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 50 50 Q 60 45 68 42"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
    <Circle cx="80" cy="80" r="2.5" fill={accent} />
  </Svg>
);
