export type IconProps = {
  size?: number;
  color?: string;
  muted?: string;
  accent?: string;
  stroke?: number;
};

export type AxisMarkerProps = IconProps & {
  position?: "top" | "mid" | "bot";
};

export type ChipIndicatorTickProps = IconProps & {
  selected?: boolean;
};