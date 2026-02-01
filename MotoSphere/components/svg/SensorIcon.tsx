import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

export default function SensorIcon({ size = 14, color = "#9BB3D6" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
    >
      <G clipPath="url(#clip0_399_667)">
        <Path
          d="M12.8334 7.00033H11.3867C11.1318 6.99978 10.8837 7.08275 10.6803 7.23656C10.477 7.39036 10.3297 7.60652 10.2609 7.85199L8.89002 12.7287C8.88118 12.759 8.86276 12.7856 8.83752 12.8045C8.81228 12.8234 8.78157 12.8337 8.75002 12.8337C8.71847 12.8337 8.68776 12.8234 8.66252 12.8045C8.63728 12.7856 8.61886 12.759 8.61002 12.7287L5.39002 1.27199C5.38118 1.2417 5.36276 1.21509 5.33752 1.19616C5.31228 1.17723 5.28157 1.16699 5.25002 1.16699C5.21847 1.16699 5.18776 1.17723 5.16252 1.19616C5.13728 1.21509 5.11886 1.2417 5.11002 1.27199L3.73919 6.14866C3.67062 6.39317 3.52416 6.60863 3.32202 6.76233C3.11989 6.91604 2.87312 6.9996 2.61919 7.00033H1.16669"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_399_667">
          <Rect width="14" height="14" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
