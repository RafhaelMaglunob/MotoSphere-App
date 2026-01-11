import React from "react";
import Svg, { Path } from "react-native-svg";

type CircleFillIconProps = {
  size?: number;
  color?: string;
};

const CircleFillIcon: React.FC<CircleFillIconProps> = ({
  size = 8,
  color = "#4ADE80",
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
    >
      <Path
        d="M0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4Z"
        fill={color}
      />
    </Svg>
  );
};

export default CircleFillIcon;
