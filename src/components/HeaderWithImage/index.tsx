import { ReactNode } from "react";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

interface HeaderWithImageProps {
  title: string;
  imageUrl: string;
}

export default function HeaderWithImage(
  props: HeaderWithImageProps
): ReactNode {
  return (
    <header className={`hero hero--primary ${styles.headerContainer}`}>
      <div className="container">
        <div className={styles.heroContent}>
          {/* Blurred background image */}
          <div
            className={styles.backgroundImage}
            style={{
              backgroundImage: `url(${props.imageUrl})`,
            }}
          />

          {/* Gradient overlay with curved cutout */}
          <div className={styles.gradientOverlay} />

          {/* SVG definition for smooth curve clip path */}
          <svg width="0" height="0" className={styles.svgClipPath}>
            <defs>
              {/* Desktop curve - subtle */}
              <clipPath id="curveClipDesktop" clipPathUnits="objectBoundingBox">
                <path d="M0,0 L0.85,0 Q0.75,0.5 0.85,1 L0,1 Z" />
              </clipPath>
              {/* Mobile curve - more pronounced */}
              <clipPath id="curveClipMobile" clipPathUnits="objectBoundingBox">
                <path d="M0,0 L0.7,0 Q0.55,0.5 0.7,1 L0,1 Z" />
              </clipPath>
            </defs>
          </svg>

          {/* Text content */}
          <div
            className={`${styles.textContent}`}
          >
            <Heading as="h1" className={`hero__title ${styles.title}`}>
              {props.title}
            </Heading>
          </div>
        </div>
      </div>
    </header>
  );
}
