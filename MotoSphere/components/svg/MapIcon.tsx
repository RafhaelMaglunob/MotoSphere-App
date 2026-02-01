import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface MapIconProps {
  width?: number;
  height?: number;
  color?: string;
  weight?: number;
}

const MapIcon: React.FC<MapIconProps> = ({
  width = 24,
  height = 24,
  color = '#fff',
  weight = 1.5,
}) => {
  return (
    <View>
      <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        {/* Map outline */}
        <Path
          d="M3 6L9 3L15 5L21 2V18L15 21L9 19L3 22V6Z"
          stroke={color}
          strokeWidth={weight}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Location pin in center */}
        <Circle
          cx="12"
          cy="11"
          r="2"
          stroke={color}
          strokeWidth={weight}
          fill={color}
        />
        
        {/* Vertical lines for map sections */}
        <Path
          d="M9 3V19"
          stroke={color}
          strokeWidth={weight * 0.7}
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
        <Path
          d="M15 5V21"
          stroke={color}
          strokeWidth={weight * 0.7}
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export default MapIcon;