import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignorar seed e scripts CJS que usam require()
    "prisma/**",
  ]),
  {
    rules: {
      // O padrão fetchData() dentro de useEffect é o correto e recomendado pelo React Docs.
      // A regra react-hooks/set-state-in-effect é excessivamente restritiva nesses casos.
      "react-hooks/set-state-in-effect": "off",
      // Permitir Math.random() em Server Components (não é um hook/render client)
      "react-hooks/purity": "off",
      // Desabilitar proibição de `any` para componentes de dados dinâmicos - apenas warning
      "@typescript-eslint/no-explicit-any": "warn",
      // Tornar unused-vars um warning ao invés de error
      "@typescript-eslint/no-unused-vars": "warn",
      // Permitir require() em arquivos JS legados
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
