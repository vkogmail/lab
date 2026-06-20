import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import mkcert from "vite-plugin-mkcert"
import framer from "vite-plugin-framer"

// https://vitejs.dev/config/
export default defineConfig({
    base: "/panel/",
    plugins: [react(), mkcert(), framer()],
    build: {
        target: "ES2022",
        rollupOptions: {
            onwarn(warning, warn) {
                if (warning.code === 'UNRECOGNIZED_FEATURE') return;
                warn(warning);
            }
        }
    },
})
