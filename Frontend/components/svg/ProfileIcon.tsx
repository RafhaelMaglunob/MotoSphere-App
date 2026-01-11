import React from 'react';
import Svg, { Path } from 'react-native-svg';
interface UserIconProps {
  width?: number;
  height?: number;
  color?: string;
  weight?: number; // new prop for stroke thickness
}

const UserIcon: React.FC<UserIconProps> = ({
  width = 20,
  height = 20,
  color = '#22D3EE',
  weight = 2, // default stroke width
}) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path
      d="M15.8333 17.5V15.8333C15.8333 14.9493 15.4821 14.1014 14.857 13.4763C14.2319 12.8512 13.384 12.5 12.5 12.5H7.49999C6.61593 12.5 5.76809 12.8512 5.14297 13.4763C4.51785 14.1014 4.16666 14.9493 4.16666 15.8333V17.5"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.99999 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 9.99999 2.5C8.15904 2.5 6.66666 3.99238 6.66666 5.83333C6.66666 7.67428 8.15904 9.16667 9.99999 9.16667Z"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


export default UserIcon;
