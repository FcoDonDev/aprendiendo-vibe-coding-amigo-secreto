/**
 * Frontend de la aplicación Amigo Secreto.
 */

/** @type {{nombre: string, correo: string}[]} */
const participantes = [];

const form = document.getElementById("form-participante");
const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const listaWrap = document.getElementById("lista-wrap");
const lista = document.getElementById("lista");
const count = document.getElementById("count");
const btnSorteo = document.getElementById("btn-sorteo");
const alerta = document.getElementById("alerta");
const resultado = document.getElementById("resultado");

/** Muestra un mensaje de estado (exito o error). */
function mostrarAlerta(mensaje, tipo) {
  alerta.hidden = false;
  alerta.className = `alerta ${tipo}`;
  alerta.textContent = mensaje;
}

function limpiarAlerta() {
  alerta.hidden = true;
  alerta.textContent = "";
}

function render() {
  listaWrap.hidden = participantes.length === 0;
  count.textContent = participantes.length;
  btnSorteo.disabled = participantes.length < 2;
  lista.innerHTML = "";

  participantes.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="datos">
        <span class="nombre"></span>
        <span class="correo"></span>
      </div>
      <button class="btn-borrar" title="Quitar a este participante" aria-label="Quitar">✕</button>
    `;
    li.querySelector(".nombre").textContent = p.nombre;
    li.querySelector(".correo").textContent = p.correo;
    li.querySelector(".btn-borrar").addEventListener("click", () => {
      participantes.splice(i, 1);
      limpiarAlerta();
      resultado.hidden = true;
      render();
    });
    lista.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim().toLowerCase();

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!nombre || !EMAIL_RE.test(correo)) {
    mostrarAlerta("Por favor ingresa un nombre y un correo válidos.", "error");
    return;
  }
  if (participantes.some((p) => p.correo === correo)) {
    mostrarAlerta(`"${nombre}" ya está en la lista con ese correo.`, "error");
    return;
  }

  participantes.push({ nombre, correo });
  inputNombre.value = "";
  inputCorreo.value = "";
  inputNombre.focus();

  limpiarAlerta();
  resultado.hidden = true;
  render();
});

btnSorteo.addEventListener("click", async () => {
  limpiarAlerta();
  resultado.hidden = true;
  btnSorteo.disabled = true;
  btnSorteo.textContent = "⏳ Sorteando y enviando correos…";
  form.classList.add("sorteando");

  try {
    const res = await fetch("/api/sorteo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantes }),
    });
    const data = await res.json();

    if (res.ok) {
      resultado.hidden = false;
      resultado.innerHTML = `🎉 <strong>¡Sorteo realizado!</strong><br />
        ${data.mensaje} Revisa tu correo electrónico 📬`;
      if (data.fallidos?.length > 0) {
        mostrarAlerta(
          `No se pudo enviar el correo a: ${data.fallidos.map((f) => f.participante).join(", ")}`,
          "error"
        );
      }
    } else {
      mostrarAlerta(data.error || "Ocurrió un error inesperado.", "error");
    }
  } catch {
    mostrarAlerta("No se pudo conectar con el servidor.", "error");
  } finally {
    form.classList.remove("sorteando");
    btnSorteo.disabled = false;
    btnSorteo.textContent = "🎲 Realizar sorteo";
  }
});
