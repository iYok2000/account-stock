import nextConfig from "eslint-config-next";

const message = "Feature must not import from other features or layout/providers. Use only @/components/ui, @/lib/utils, @/contexts (and same-feature lib).";

/** Patterns to restrict per feature — each feature folder gets all OTHER features + layout/providers restricted. */
function restrictedPatterns(excludeFeature) {
  const targets = [
    ["@/components/inventory", "@/components/inventory/*"],
    ["@/components/calculator", "@/components/calculator/*"],
    ["@/components/upload", "@/components/upload/*"],
    ["@/components/layout", "@/components/layout/*"],
    ["@/components/providers", "@/components/providers/*"],
    ["@/components/AppSwitcher"],
  ].filter(([path]) => !path.startsWith(excludeFeature));
  return targets.map((group) => ({ group, message }));
}

const baseConfig = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

const config = [
  ...baseConfig,
  // Pre-go-live: allow setState in useEffect for hydration/localStorage sync; refactor later.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
  {
    files: ["components/inventory/**/*.ts", "components/inventory/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: restrictedPatterns("@/components/inventory") }],
    },
  },
  {
    files: ["components/calculator/**/*.ts", "components/calculator/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: restrictedPatterns("@/components/calculator") }],
    },
  },
  {
    files: ["components/upload/**/*.ts", "components/upload/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: restrictedPatterns("@/components/upload") }],
    },
  },
];

export default config;
