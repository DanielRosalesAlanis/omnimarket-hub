import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        OmniMarket Hub es un proyecto académico que demuestra un panel de analítica para comercio electrónico. Los
        pedidos que muestra son datos ficticios generados automáticamente.
      </p>
      <h2>Datos que recibimos</h2>
      <p>
        Al iniciar sesión con Google o GitHub recibimos únicamente tu nombre, tu correo electrónico y tu foto de perfil,
        a través del protocolo OAuth 2.0. Nunca recibimos ni almacenamos tu contraseña.
      </p>
      <h2>Uso de los datos</h2>
      <p>
        Esos datos se usan solo para identificar tu sesión y mostrar tu nombre en el panel. Se guardan en una cookie de
        sesión cifrada en tu navegador; no se almacenan en una base de datos, no se comparten con terceros y no se usan
        con fines publicitarios.
      </p>
      <h2>Eliminación</h2>
      <p>
        Al pulsar «Salir» se elimina la cookie de sesión. Puedes revocar el acceso en cualquier momento desde la
        configuración de seguridad de tu cuenta de Google o GitHub.
      </p>
    </LegalPage>
  );
}
