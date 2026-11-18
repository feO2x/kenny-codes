import React, {type ReactNode, useEffect, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface AnimatedImageProps {
  /** Path of the animated image under `static/`, e.g. `/img/chuck.gif`. */
  src: string;
  /** Path of a still frame of the same size under `static/`. */
  still: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * An animated GIF with a pause button. It starts paused when the visitor prefers reduced motion,
 * and on the server, so the static HTML never autoplays for them.
 */
export default function AnimatedImage({src, still, alt, width, height}: AnimatedImageProps): ReactNode {
  const [playing, setPlaying] = useState(false);
  const animatedUrl = useBaseUrl(src);
  const stillUrl = useBaseUrl(still);

  useEffect(() => {
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <figure className={styles.figure}>
      <img
        src={playing ? animatedUrl : stillUrl}
        alt={alt}
        width={width}
        height={height}
        className={styles.image}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={!playing}
        onClick={() => setPlaying((value) => !value)}>
        {playing ? 'Pause animation' : 'Play animation'}
      </button>
    </figure>
  );
}
