import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

export default function MailIcon({
  size = 16,
  stroke = "rgba(6,182,212,0.7)",
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Defs>
        <ClipPath id="clip">
          <Rect width="16" height="16" />
        </ClipPath>
      </Defs>

      <G clipPath="url(#clip)">
        <Path
          d="M14.6666 4.66699L8.67265 8.48499C8.46924 8.60313 8.2382 8.66536 8.00298 8.66536C7.76776 8.66536 7.53672 8.60313 7.33331 8.48499L1.33331 4.66699"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.3333 2.66699H2.66665C1.93027 2.66699 1.33331 3.26395 1.33331 4.00033V12.0003C1.33331 12.7367 1.93027 13.3337 2.66665 13.3337H13.3333C14.0697 13.3337 14.6666 12.7367 14.6666 12.0003V4.00033C14.6666 3.26395 14.0697 2.66699 13.3333 2.66699Z"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}
