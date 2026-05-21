import { defineConfig } from "vite";

export default defineConfig({

    build: {

        outDir: "public",

        emptyOutDir: false,

        rollupOptions: {

            output: {

                entryFileNames: "Assets/Dist/[name].js",

                chunkFileNames: "Assets/Dist/[name].js",

                assetFileNames: (assetInfo) => {

                    const ext = assetInfo.name.split(".").pop();

                    if (ext === "css") {

                        return "Assets/Dist/[name].[ext]";
                    }

                    return "Assets/Dist/[name].[ext]";
                }
            }
        }
    }
});