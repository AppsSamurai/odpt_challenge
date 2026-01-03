import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BASE = "/odpt_challenge/";

export default defineConfig({
    plugins: [react()],
    base: BASE,
});
