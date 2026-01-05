import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LockIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const LockIcon: React.FC<LockIconProps> = ({ width = 20, height = 20, color = '#94A3B8' }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path
      d="M15.8333 9.16699H4.16667C3.24619 9.16699 2.5 9.91318 2.5 10.8337V16.667C2.5 17.5875 3.24619 18.3337 4.16667 18.3337H15.8333C16.7538 18.3337 17.5 17.5875 17.5 16.667V10.8337C17.5 9.91318 16.7538 9.16699 15.8333 9.16699Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.83325 9.16699V5.83366C5.83325 4.72859 6.27224 3.66878 7.05364 2.88738C7.83504 2.10598 8.89485 1.66699 9.99992 1.66699C11.105 1.66699 12.1648 2.10598 12.9462 2.88738C13.7276 3.66878 14.1666 4.72859 14.1666 5.83366V9.16699"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default LockIcon;
