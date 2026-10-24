import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Términos de servicio" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos de servicio">
      <p>
        OmniMarket Hub es un proyecto académico de demostración. Se ofrece «tal cual», sin garantías de disponibilidad,
        y puede modificarse o retirarse en cualquier momento.
      </p>
      <h2>Uso permitido</h2>
      <p>
        El servicio está destinado a la evaluación del proyecto. Todos los pedidos y montos son ficticios y pueden
        restablecerse en cualquier momento mediante el endpoint de pruebas <code>/api/test/reset-data</code>.
      </p>
      <h2>Cuentas</h2>
      <p>
        El acceso se realiza exclusivamente con cuentas de Google o GitHub. Consulta la{" "}
        <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
          política de privacidad
        </Link>{" "}
        para saber qué datos se reciben y cómo se usan.
      </p>
    </LegalPage>
  );
}
