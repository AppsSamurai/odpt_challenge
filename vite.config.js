import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BASE = "/"; // change to "/ODPT/" if needed

export default defineConfig({
    plugins: [react()],
    base: BASE,
});
