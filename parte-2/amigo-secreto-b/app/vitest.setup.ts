import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Empareja los igualadores de jest-dom con el `expect` de Vitest.
import "@testing-library/jest-dom/vitest";

// Limpia el DOM entre pruebas, como hace jest por defecto.
afterEach(() => {
  cleanup();
});
