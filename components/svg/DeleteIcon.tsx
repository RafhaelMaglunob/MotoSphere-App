import React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";

export const DeleteIcon = ({ size = 16, color = "#9BB3D6" }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <G clipPath="url(#clip0)">
      <Path d="M2 4H14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3334 14.6667H4.66671C4.00004 14.6667 3.33337 14 3.33337 13.3333V4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5.33337 3.99967V2.66634C5.33337 1.99967 6.00004 1.33301 6.66671 1.33301H9.33337C10 1.33301 10.6667 1.99967 10.6667 2.66634V3.99967" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M6.66663 7.33301V11.333" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9.33337 7.33301V11.333" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </G>
    <Defs>
      <ClipPath id="clip0">
        <Rect width="16" height="16" fill="white"/>
      </ClipPath>
    </Defs>
  </Svg>
);
