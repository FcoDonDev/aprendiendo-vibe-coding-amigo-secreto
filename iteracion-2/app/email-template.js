/**
 * Plantilla del correo con la asignación del Amigo Secreto.
 */

/**
 * @param {{ de: {nombre: string}, para: {nombre: string}, fecha: string }} data
 * @returns {{ text: string, html: string }}
 */
function buildAssignmentEmail({ de, para, fecha }) {
  const text = [
    `Hola ${de.nombre}!`,
    "",
    `Ya se realizó el sorteo del Amigo Secreto (${fecha}) y te toca darle un regalo a:`,
    "",
    `   🎁 ${para.nombre}`,
    "",
    "Recuerda mantener el secreto y no contarle a nadie a quién le toca darle el regalo.",
    "¡Felices fiestas!",
    "",
    "-- El organizador del Amigo Secreto",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td align="center" style="font-size:48px;padding-bottom:8px;">&#127873;</td>
            </tr>
            <tr>
              <td align="center" style="font-size:22px;font-weight:bold;color:#333333;padding-bottom:16px;">
                Amigo Secreto
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;color:#555555;line-height:1.6;padding-bottom:20px;">
                Hola <strong>${de.nombre}</strong>,
                <br /><br />
                Ya se realizó el sorteo del Amigo Secreto (<strong>${fecha}</strong>) y
                te toca darle un regalo a:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="display:inline-block;background:#fdf2f8;border:2px dashed #ec4899;
                            border-radius:10px;padding:16px 28px;font-size:20px;font-weight:bold;color:#be185d;">
                  &#127873; ${para.nombre}
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#777777;line-height:1.6;">
                Recuerda mantener el secreto &#129323; y no contarle a nadie a quién le toca darle el regalo.
              </td>
            </tr>
          </table>
          <div style="max-width:520px;font-size:12px;color:#aaaaaa;padding-top:16px;">
            Este mensaje fue enviado automáticamente por la aplicación Amigo Secreto.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

module.exports = { buildAssignmentEmail };
