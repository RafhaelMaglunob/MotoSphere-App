// components/svg/EditIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  width?: number;
  height?: number;
  color?: string;
}

export const EditIcon: React.FC<Props> = ({ width = 16, height = 16, color = "#9BB3D6" }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path
      d="M13.7826 4.20825C14.1351 3.85587 14.3331 3.3779 14.3332 2.87949C14.3333 2.38108 14.1353 1.90306 13.783 1.55059C13.4306 1.19811 12.9526 1.00006 12.4542 1C11.9558 0.999937 11.4778 1.19787 11.1253 1.55025L2.22796 10.4496C2.07317 10.6039 1.9587 10.7939 1.89462 11.0029L1.01396 13.9043C0.996726 13.9619 0.995425 14.0232 1.01019 14.0815C1.02496 14.1398 1.05524 14.1931 1.09782 14.2356C1.1404 14.2781 1.1937 14.3083 1.25206 14.323C1.31042 14.3376 1.37166 14.3362 1.42929 14.3189L4.33129 13.4389C4.54007 13.3754 4.73007 13.2616 4.88462 13.1076L13.7826 4.20825Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
