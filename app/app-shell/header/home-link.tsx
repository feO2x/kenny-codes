import Link from "next/link";
import icon from "../../icon.svg";
import styles from "./home-link.module.scss";
import signature from "./kenny-codes-header-signature.svg";
import ExportedImage from "next-image-export-optimizer";

export function HomeLink() {
    return (
        <Link href="/" aria-label="Home Link" className={styles["home-link"]}>
            <ExportedImage src={icon} width={40} height={40} alt="Home" />
            <ExportedImage
                src={signature}
                height={32}
                className={styles.signature}
                alt="Home"
            />
        </Link>
    );
}
