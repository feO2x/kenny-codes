import ExportedImage from "next-image-export-optimizer";
import photo from "./feO2x.jpg";
import styles from "./avatar.module.scss";

export function Avatar() {
    return (
        <div className={styles.avatar}>
            <ExportedImage
                src={photo}
                alt="Photo of Kenny"
                width={256}
                height={256}
            />
            <h2>Hi, I&apos;m Kenny</h2>
            <p>
                I can help you with Software Architecture and Design,
                Distributed Systems based on ASP.NET Core, as well as .NET
                internals.
            </p>
        </div>
    );
}
