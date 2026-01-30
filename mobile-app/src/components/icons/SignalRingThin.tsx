import React from "react";
import Svg, { Path } from "react-native-svg";

type IconProps = {
  size?: number;
  muted?: string;
  stroke?: number;
};

export const SignalRingThin: React.FC<IconProps> = ({
  size = 24,
  muted = "#CFC9BF",
  stroke = 1.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M 50 10 A 40 40 0 1 1 78.28 78.28"
      stroke={muted}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);