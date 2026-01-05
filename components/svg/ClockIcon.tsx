import React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

type ClockIconProps = {
  size?: number;
  color?: string;
};

export const ClockIcon: React.FC<ClockIconProps> = ({
  size = 12,
  color = "#9BB3D6",
}) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <G clipPath="url(#clip0)">
      <Path
        d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 3V6L8 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0">
        <Rect width={12} height={12} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);
