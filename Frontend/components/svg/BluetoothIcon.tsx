import Svg, { Path } from "react-native-svg";

export function BluetoothIcon({ width = 19, height = 36, color = "#22D3EE" }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 19 36" fill="none">
      <Path
        d="M1 9.33333L17.6667 26L9.33333 34.3333V1L17.6667 9.33333L1 26"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
