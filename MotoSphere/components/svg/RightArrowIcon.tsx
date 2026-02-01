import React from "react";
import Svg, { Path } from "react-native-svg";

export default function RightArrowIcon({ size = 20, color = "#22D3EE" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M7.5 15L12.5 10L7.5 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
