import React from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

interface BatteryIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function BatteryIcon({ width = 14, height = 14, color = '#9BB3D6' }: BatteryIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 14 14" fill="none">
      <G clipPath="url(#clip0)">
        <Path
          d="M12.8333 8.16634V5.83301"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.33335 3.5H2.33335C1.68902 3.5 1.16669 4.02233 1.16669 4.66667V9.33333C1.16669 9.97767 1.68902 10.5 2.33335 10.5H9.33335C9.97769 10.5 10.5 9.97767 10.5 9.33333V4.66667C10.5 4.02233 9.97769 3.5 9.33335 3.5Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0">
          <Rect width="14" height="14" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
