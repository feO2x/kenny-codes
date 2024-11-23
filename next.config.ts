import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export",
    images: {
        loader: "custom",
        imageSizes: [300, 500],
        deviceSizes: [768, 1080, 1440, 1920, 2028, 3840],
    },
    transpilePackages: ["next-image-export-optimizer"],
    env: {
        nextImageExportOptimizer_imageFolderPath: "public/images",
        nextImageExportOptimizer_exportFolderPath: "out",
        nextImageExportOptimizer_quality: "90",
        nextImageExportOptimizer_storePicturesInWEBP: "true",
        nextImageExportOptimizer_exportFolderName: "nextImageExportOptimizer",
        nextImageExportOptimizer_generateAndUseBlurImages: "true",
        nextImageExportOptimizer_remoteImageCacheTTL: "0",
    },
};

export default nextConfig;
