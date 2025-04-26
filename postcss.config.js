import tailwindcssPlugin from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssThemeUi from "postcss-theme-ui";
import postcssCustomMedia from "postcss-custom-media";
import postcssCustomSelectors from "postcss-custom-selectors";
import postcssCustomProperties from "postcss-custom-properties";

export default {
  plugins: [
    tailwindcssPlugin,
    autoprefixer,
    postcssImport,
    postcssNesting,
    postcssThemeUi,
    postcssCustomMedia,
    postcssCustomSelectors,
    postcssCustomProperties,
  ],
};
