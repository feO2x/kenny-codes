import Link from "next/link";
import { FaTwitter, FaYoutube, FaGithub, FaLinkedin } from "react-icons/fa6";
import styles from "./social-links.module.scss";

export function SocialLinks() {
    return (
        <ul className={styles["social-links"]}>
            <li>
                <Link
                    href="https://twitter.com/feO2x"
                    aria-label="Link to Twitter profile"
                    target="_blank"
                >
                    <FaTwitter />
                </Link>
            </li>
            <li>
                <Link
                    href="https://youtube.com/c/kennypflug"
                    aria-label="Link to YouTube channel"
                    target="_blank"
                >
                    <FaYoutube />
                </Link>
            </li>
            <li>
                <Link
                    href="https://youtube.com/c/kennypflug"
                    aria-label="Link to GitHub profile"
                    target="_blank"
                >
                    <FaGithub />
                </Link>
            </li>
            <li>
                <Link
                    href="https://www.linkedin.com/in/kenny-pflug-7a1012123/"
                    aria-label="Link to LinkedIn profile"
                    target="_blank"
                >
                    <FaLinkedin />
                </Link>
            </li>
        </ul>
    );
}
