import Svg, { Path, Rect } from 'react-native-svg';

/** Backgroundless rank marks for the reviews visibility banner. */
export function RankBannerArt() {
  return (
    <Svg
      pointerEvents="none"
      width={64}
      height={40}
      viewBox="0 0 118 78"
      style={{ position: 'absolute', right: 8, top: 3 }}
    >
      <Rect x="62" y="44" width="12" height="22" rx="3" fill="#FFFFFF" fillOpacity={0.42} />
      <Rect x="78" y="30" width="12" height="36" rx="3" fill="#FFFFFF" fillOpacity={0.58} />
      <Rect x="94" y="16" width="12" height="50" rx="3" fill="#FFFFFF" fillOpacity={0.78} />
      <Path
        d="M24 10.5l2.4 7.2H34l-6 4.4 2.3 7.1-6.3-4.5-6.3 4.5 2.3-7.1-6-4.4h7.6L24 10.5z"
        fill="#FDE68A"
      />
      <Path
        d="M48 6l1.7 5.1H55l-4.2 3.1 1.6 5-4.4-3.2-4.4 3.2 1.6-5-4.2-3.1h5.3L48 6z"
        fill="#FFFFFF"
        fillOpacity={0.85}
      />
      <Path
        d="M38 54c8.3 0 15-4.7 15-10.5S46.3 33 38 33s-15 4.7-15 10.5c0 2.4 1.2 4.6 3.2 6.4-.2 3.4-2.4 6-2.4 6s4.6-.6 7.4-2.6c2.1.5 4.4.7 6.8.7z"
        fill="#FFFFFF"
        fillOpacity={0.55}
      />
    </Svg>
  );
}
