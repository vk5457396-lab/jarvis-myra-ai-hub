import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default tseslint.config(
  { ignores: [".next", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  ...nextCoreWebVitals,
  {
    // These are newer, stricter react-hooks rules bundled with eslint-config-next
    // that weren't enforced by the pre-migration eslint config. The codebase predates
    // them; downgrading keeps lint usable without an unrelated cleanup pass.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/client",
              message: "Route Handlers must use the service-role client in src/app/api/_lib/utils/supabase.ts, not the browser client.",
            },
          ],
        },
      ],
    },
  },
);
