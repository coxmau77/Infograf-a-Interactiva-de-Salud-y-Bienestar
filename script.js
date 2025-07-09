// Function to calculate age
function calculateAge(dob) {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Function to export a chart to PDF
async function exportChartToPdf(chartId, filename) {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    console.error("Chart element not found:", chartId);
    return;
  }

  // Oculta el botón de exportar temporalmente
  const exportButton = chartElement.querySelector(".export-button");
  if (exportButton) {
    exportButton.style.display = "none";
  }

  // --- NUEVO: Forzar ancho máximo de 600px para los gráficos antes de exportar ---
  let originalWidth = null;
  let containerToResize = null;
  if (chartId.includes("weight")) {
    containerToResize = chartElement.querySelector(".weight-chart-container");
  } else if (chartId.includes("bp")) {
    containerToResize = chartElement.querySelector(".line-chart-container");
  }
  if (containerToResize) {
    originalWidth = containerToResize.style.maxWidth;
    containerToResize.style.maxWidth = "600px";
    containerToResize.style.width = "100%";
    containerToResize.style.marginLeft = "auto";
    containerToResize.style.marginRight = "auto";
  }

  try {
    // Usa html2canvas para capturar el gráfico
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    // Formato A4 en px: 595 x 842 (portrait)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 30;
    let y = margin;

    // Datos personales desde la última medición
    const measurements =
      JSON.parse(localStorage.getItem("healthMeasurements")) || [];
    const last = measurements.length > 0 ? measurements[0] : null;
    const now = new Date().toLocaleString("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    pdf.setFontSize(14);
    pdf.text(`Nombre: ${last?.userName || "N/A"}`, margin, y);
    y += 20;
    pdf.text(
      `Edad: ${last?.age !== undefined ? last.age + " años" : "N/A"}`,
      margin,
      y
    );
    y += 20;
    pdf.text(`Email: ${last?.email || "N/A"}`, margin, y);
    y += 20;
    pdf.text(`Fecha y Hora de Registro: ${now}`, margin, y);
    y += 20;
    // Si es gráfico de presión arterial, agrega presión
    if (chartId.includes("bp")) {
      pdf.text(
        `Presión: ${last?.systolic || "--"}/${last?.diastolic || "--"} mmHg`,
        margin,
        y
      );
      y += 20;
      const estadoPresion =
        document.getElementById("normal-bp-range")?.textContent || "--";
      pdf.text(`Estado presión: ${estadoPresion}`, margin, y);
      y += 20;
    }
    // Si es gráfico de peso, agrega peso y rango
    if (chartId.includes("weight")) {
      pdf.text(`Peso: ${last?.weight || "--"} kg`, margin, y);
      y += 20;
      pdf.text(`Estatura: ${last?.height || "--"} cm`, margin, y);
      y += 20;
      const rangoPeso =
        document.getElementById("normal-weight-range")?.textContent || "--";
      pdf.text(`Rango saludable: ${rangoPeso}`, margin, y);
      y += 20;
    }
    // Título del gráfico
    const chartTitleElement = chartElement.querySelector("h3");
    const chartTitle = chartTitleElement
      ? chartTitleElement.textContent
      : "Gráfico de Salud";
    pdf.text(`Gráfico: ${chartTitle}`, margin, y);
    y += 20;

    // Calcula el tamaño de la imagen para que quepa en A4 y nunca sobresalga
    const maxImgWidth = pageWidth - margin * 2;
    const maxImgHeight = pageHeight - y - margin;
    let imgWidth = canvas.width;
    let imgHeight = canvas.height;
    // Escala la imagen si es necesario para que nunca sobresalga
    const widthRatio = maxImgWidth / imgWidth;
    const heightRatio = maxImgHeight / imgHeight;
    const scale = Math.min(widthRatio, heightRatio, 1);
    imgWidth = imgWidth * scale;
    imgHeight = imgHeight * scale;

    // Centra la imagen horizontalmente si es más pequeña que el área
    const imgX = margin + (maxImgWidth - imgWidth) / 2;
    pdf.addImage(imgData, "PNG", imgX, y, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Error exporting chart to PDF:", error);
  } finally {
    // Restaurar el ancho original del contenedor
    if (containerToResize) {
      containerToResize.style.maxWidth = originalWidth || "";
      containerToResize.style.marginLeft = "";
      containerToResize.style.marginRight = "";
    }
    if (exportButton) {
      exportButton.style.display = "block";
    }
  }
}

// JavaScript for section transitions (Intersection Observer)
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1, // Trigger when 10% of the section is visible
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        // Optional: remove class when out of view if you want re-animation on scroll back
        // entry.target.classList.remove('is-visible');
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  // JavaScript for typewriter effect
  const typewriterElements = document.querySelectorAll(".typewriter-text");

  typewriterElements.forEach((element) => {
    const text = element.getAttribute("data-text");
    element.textContent = ""; // Clear initial text
    let i = 0;
    const speed = 70; // Typing speed in milliseconds

    function typeWriter() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      } else {
        // Remove blinking cursor after typing is complete
        element.style.borderRight = "none";
      }
    }

    // Use Intersection Observer for typewriter effect as well
    const typewriterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !element.classList.contains("typed")) {
            typeWriter();
            element.classList.add("typed"); // Mark as typed
            observer.unobserve(element); // Stop observing once typed
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.8, // Trigger when 80% of the title is visible
      }
    );

    typewriterObserver.observe(element);
  });

  // --- Local Storage y lógica de gráficos/métricas dinámicas ---
  const MEASUREMENTS_KEY = "healthMeasurements";
  const PERSONAL_DATA_KEY = "personalHealthData";
  const MAX_HISTORY_ITEMS = 5; // Mostrar últimos 5 en historial

  const generateChartsButton = document.getElementById(
    "generate-charts-button"
  );
  const userNameInput = document.getElementById("user-name");
  const dobInput = document.getElementById("dob");
  const emailInput = document.getElementById("email");
  const systolicInput = document.getElementById("systolic-pressure");
  const diastolicInput = document.getElementById("diastolic-pressure");
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  const normalMetricsDisplay = document.getElementById(
    "normal-metrics-display"
  );
  const normalBpRange = document.getElementById("normal-bp-range");
  const normalWeightRange = document.getElementById("normal-weight-range");

  const bpLineChartSvg = document.getElementById("bp-line-chart-svg");
  const userWeightBar = document.getElementById("user-weight-bar");
  const minHealthyWeightBar = document.getElementById("min-healthy-weight-bar");
  const maxHealthyWeightBar = document.getElementById("max-healthy-weight-bar");
  const measurementHistoryDiv = document.getElementById("measurement-history");

  // Agregar el botón de limpiar datos personales debajo del botón 'Generar Gráficos y Métricas'
  const userDataSection = document.getElementById("user-data-input-section");
  const clearButton = document.createElement("button");
  clearButton.textContent = "Limpiar datos personales";
  clearButton.className =
    "generate-button bg-red-500 hover:bg-red-700 text-white mt-2";
  clearButton.type = "button";
  clearButton.style.marginTop = "0.5rem";
  clearButton.onclick = function () {
    // Elimina los datos personales del localStorage
    localStorage.removeItem(PERSONAL_DATA_KEY);
    // Limpia los inputs
    userNameInput.value = "";
    dobInput.value = "";
    emailInput.value = "";
    heightInput.value = "";
    weightInput.value = "";
    systolicInput.value = "";
    diastolicInput.value = "";
  };
  // Insertar el botón después del botón de generar gráficos
  const generateBtn = document.getElementById("generate-charts-button");
  generateBtn.parentNode.insertBefore(clearButton, generateBtn.nextSibling);

  // Modificar loadPersonalData para que si hay datos en localStorage los use, si no, deje los campos vacíos
  function loadPersonalData() {
    const personalData = JSON.parse(localStorage.getItem(PERSONAL_DATA_KEY));
    if (personalData) {
      if (personalData.userName) userNameInput.value = personalData.userName;
      if (personalData.dob) dobInput.value = personalData.dob;
      if (personalData.email) emailInput.value = personalData.email;
      if (personalData.height) heightInput.value = personalData.height;
      if (personalData.weight) weightInput.value = personalData.weight;
      if (personalData.systolic) systolicInput.value = personalData.systolic;
      if (personalData.diastolic) diastolicInput.value = personalData.diastolic;
    } else {
      userNameInput.value = "";
      dobInput.value = "";
      emailInput.value = "";
      heightInput.value = "";
      weightInput.value = "";
      systolicInput.value = "";
      diastolicInput.value = "";
    }
  }

  // --- NUEVO: Guardar datos personales en localStorage ---
  function savePersonalData() {
    const personalData = {
      userName: userNameInput.value.trim(),
      dob: dobInput.value,
      email: emailInput.value.trim(),
      height: heightInput.value,
      weight: weightInput.value,
      systolic: systolicInput.value,
      diastolic: diastolicInput.value,
    };
    localStorage.setItem(PERSONAL_DATA_KEY, JSON.stringify(personalData));
  }

  // Llama a loadPersonalData al cargar la página
  loadPersonalData();

  // Load measurements from local storage on page load
  let measurements = JSON.parse(localStorage.getItem(MEASUREMENTS_KEY)) || [];
  renderHistory();

  generateChartsButton.addEventListener("click", () => {
    const userName = userNameInput.value.trim();
    const dob = dobInput.value;
    const email = emailInput.value.trim();
    const systolic = parseFloat(systolicInput.value);
    const diastolic = parseFloat(diastolicInput.value);
    const heightCm = parseFloat(heightInput.value);
    const weightKg = parseFloat(weightInput.value);

    if (
      !userName ||
      !dob ||
      !email ||
      !systolic ||
      !diastolic ||
      !heightCm ||
      !weightKg
    ) {
      alert(
        "Por favor, completa todos los campos (incluyendo tu nombre, fecha de nacimiento y email) para generar los gráficos y métricas."
      );
      return;
    }

    // --- NUEVO: Guardar datos personales al generar gráficos ---
    savePersonalData();

    const userAge = calculateAge(dob);

    // Save current measurement to history
    const newMeasurement = {
      date: new Date().toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      userName: userName,
      dob: dob,
      age: userAge,
      email: email,
      systolic: systolic,
      diastolic: diastolic,
      height: heightCm,
      weight: weightKg,
    };
    measurements.unshift(newMeasurement); // Add to the beginning
    // Keep only the latest MAX_HISTORY_ITEMS
    if (measurements.length > MAX_HISTORY_ITEMS) {
      measurements = measurements.slice(0, MAX_HISTORY_ITEMS);
    }
    localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
    renderHistory(); // Re-render history after adding new data

    // --- Update Normal Metrics ---
    let bpStatus = "";
    if (systolic < 120 && diastolic < 80) {
      bpStatus = "Óptima (menos de 120/80 mmHg)";
    } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      bpStatus = "Normal (120-129/menos de 80 mmHg)";
    } else if (
      (systolic >= 130 && systolic <= 139) ||
      (diastolic >= 80 && diastolic <= 89)
    ) {
      bpStatus = "Elevada (130-139/80-89 mmHg)";
    } else if (systolic >= 140 || diastolic >= 90) {
      bpStatus = "Alta (140+/90+ mmHg)";
    } else {
      bpStatus = "Rango no clasificado";
    }
    normalBpRange.textContent = bpStatus;

    const heightM = heightCm / 100;
    const minHealthyWeight = 18.5 * (heightM * heightM);
    const maxHealthyWeight = 24.9 * (heightM * heightM);
    normalWeightRange.textContent = `${minHealthyWeight.toFixed(
      1
    )} kg - ${maxHealthyWeight.toFixed(1)} kg`;

    normalMetricsDisplay.style.display = "block";

    // --- Update Weight Bar Chart ---
    const chartMaxHeight = 100; // Percentage of container height for bars
    const maxPossibleWeightForChart = Math.max(
      weightKg,
      maxHealthyWeight * 1.2
    ); // Scale chart to fit values

    userWeightBar.style.height = `${
      (weightKg / maxPossibleWeightForChart) * chartMaxHeight
    }%`;
    minHealthyWeightBar.style.height = `${
      (minHealthyWeight / maxPossibleWeightForChart) * chartMaxHeight
    }%`;
    maxHealthyWeightBar.style.height = `${
      (maxHealthyWeight / maxPossibleWeightForChart) * chartMaxHeight
    }%`;

    // Reset animation for bars
    userWeightBar.style.animation = "none";
    minHealthyWeightBar.style.animation = "none";
    maxHealthyWeightBar.style.animation = "none";
    void userWeightBar.offsetWidth; // Trigger reflow
    userWeightBar.style.animation = "grow-bar 1.5s ease-out forwards";
    minHealthyWeightBar.style.animation = "grow-bar 1.5s ease-out forwards";
    maxHealthyWeightBar.style.animation = "grow-bar 1.5s ease-out forwards";

    // --- Update Blood Pressure Line Chart with User Data ---
    // Remove existing user BP point and text
    const existingUserBpPoint = bpLineChartSvg.querySelector(".user-bp-point");
    const existingUserBpText = bpLineChartSvg.querySelector(".user-bp-text");
    if (existingUserBpPoint) existingUserBpPoint.remove();
    if (existingUserBpText) existingUserBpText.remove();

    // Map systolic pressure to Y-coordinate (example scale: 140mmHg at y=20, 80mmHg at y=130)
    const bpMinChart = 70; // min pressure value for chart Y-axis
    const bpMaxChart = 150; // max pressure value for chart Y-axis
    const svgHeight = 150; // viewBox height
    const svgYAxisStart = 130; // Y-coordinate for the bottom of the chart
    const svgYAxisEnd = 20; // Y-coordinate for the top of the chart

    // Calculate Y position for systolic pressure
    // Linear interpolation: Y = Y_start + (Value - Value_min) * (Y_end - Y_start) / (Value_max - Value_min)
    // Since higher pressure means lower Y, it's: Y = Y_start - (Value - Value_min) * (Y_start - Y_end) / (Value_max - Value_min)
    const yBp =
      svgYAxisStart -
      ((systolic - bpMinChart) * (svgYAxisStart - svgYAxisEnd)) /
        (bpMaxChart - bpMinChart);
    const clampedYBp = Math.max(svgYAxisEnd, Math.min(svgYAxisStart, yBp));

    // For simplicity, place the user's BP point at a fixed X-position (e.g., "now" or "morning")
    const userBpX = 100; // Corresponding to "Mañana" on the chart

    const userBpCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    userBpCircle.setAttribute("class", "user-bp-point");
    userBpCircle.setAttribute("cx", userBpX);
    userBpCircle.setAttribute("cy", clampedYBp);
    userBpCircle.setAttribute("r", "5");
    bpLineChartSvg.appendChild(userBpCircle);

    // Add text label for the user's BP
    const userBpText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    userBpText.setAttribute("class", "user-bp-text"); // Add a class for easy removal
    userBpText.setAttribute("x", userBpX + 10);
    userBpText.setAttribute("y", clampedYBp - 5);
    userBpText.setAttribute("fill", "#e2e8f0");
    userBpText.setAttribute("font-size", "0.75rem");
    userBpText.textContent = `${systolic}/${diastolic}`;
    userBpText.style.animation = "fade-in 1s ease-out forwards";
    bpLineChartSvg.appendChild(userBpText);
  });

  function renderHistory() {
    if (measurements.length === 0) {
      measurementHistoryDiv.innerHTML =
        '<p class="text-center text-gray-400">No hay registros aún.</p>';
      return;
    }

    let historyHtml = `
                <h3 class="text-xl mb-4">Últimas ${Math.min(
                  MAX_HISTORY_ITEMS,
                  measurements.length
                )} Mediciones:</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Email</th>
                                <th>Presión (mmHg)</th>
                                <th>Peso (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

    for (let i = 0; i < Math.min(MAX_HISTORY_ITEMS, measurements.length); i++) {
      const m = measurements[i];
      historyHtml += `
                    <tr>
                        <td>${m.date}</td>
                        <td>${m.userName || "N/A"}</td>
                        <td>${m.age !== "N/A" ? m.age + " años" : "N/A"}</td>
                        <td>${m.email || "N/A"}</td>
                        <td>${m.systolic}/${m.diastolic}</td>
                        <td>${m.weight.toFixed(1)}</td>
                    </tr>
                `;
    }

    historyHtml += `
                        </tbody>
                    </table>
                </div>
            `;
    measurementHistoryDiv.innerHTML = historyHtml;
  }

  // LLM Integration
  const analyzeButton = document.getElementById("analyze-button");
  const userInput = document.getElementById("user-input");
  const llmResponseDiv = document.getElementById("llm-response");
  const loadingIndicator = document.getElementById("loading-indicator");

  analyzeButton.addEventListener("click", async () => {
    const userQuery = userInput.value.trim();
    if (!userQuery) {
      llmResponseDiv.textContent = "Por favor, introduce tu consulta.";
      return;
    }

    loadingIndicator.style.display = "block";
    llmResponseDiv.textContent = ""; // Clear previous response

    // Get current user inputs for more context
    const userName = userNameInput.value.trim();
    const dob = dobInput.value;
    const userAge = calculateAge(dob);
    const email = emailInput.value.trim();
    const systolic = systolicInput.value
      ? `Sistólica: ${systolicInput.value} mmHg`
      : "";
    const diastolic = diastolicInput.value
      ? `Diastólica: ${diastolicInput.value} mmHg`
      : "";
    const height = heightInput.value ? `Altura: ${heightInput.value} cm` : "";
    const weight = weightInput.value ? `Peso: ${weightInput.value} kg` : "";

    const userDataContext = [
      userName ? `Nombre: ${userName}` : "",
      userAge !== "N/A" ? `Edad: ${userAge} años` : "",
      email ? `Email: ${email}` : "",
      systolic,
      diastolic,
      height,
      weight,
    ]
      .filter(Boolean)
      .join(", ");

    // Context from the infographic for the LLM
    const bpContext = `
                La presión arterial varía naturalmente a lo largo del día. Se recomienda tomarla por la mañana (6:30-8:00 a.m., antes de desayuno/medicación) y por la noche (8:00-9:30 p.m.).
                Rangos de presión arterial: Verde (normal, ej. 120/80), Amarillo (ligeramente elevado, 130-139 / 80-89), Rojo (alta, 140+ / 90+).
                El control diario con horario fijo aplica si hay diagnóstico o indicación médica.
            `;
    const weightContext = `
                Se recomienda pesarse 1 vez por semana (ideal), siempre a la misma hora (mañana, en ayunas, después de orinar, sin ropa o con ropa ligera).
                No es recomendable pesarse todos los días debido a fluctuaciones por líquidos, digestión, hormonas, estrés, etc. Lo importante es la tendencia a largo plazo.
                El IMC saludable se considera entre 18.5 y 24.9.
            `;

    const prompt = `Eres un asistente de salud que proporciona consejos breves y útiles basados en la siguiente información sobre control de presión arterial y peso. No inventes información médica; si no puedes responder con la información proporcionada, dilo.

            Información de referencia sobre presión arterial:
            ${bpContext}

            Información de referencia sobre control de peso:
            ${weightContext}

            Datos del usuario proporcionados (si aplica): ${
              userDataContext || "Ninguno"
            }

            Consulta del usuario:
            ${userQuery}

            Basado en la información de referencia y los datos del usuario, proporciona un consejo breve y útil.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        llmResponseDiv.textContent = text;
      } else {
        llmResponseDiv.textContent =
          "No se pudo obtener una respuesta. Inténtalo de nuevo más tarde.";
      }
    } catch (error) {
      console.error("Error al llamar a la API de Gemini:", error);
      llmResponseDiv.textContent =
        "Ocurrió un error al procesar tu solicitud. Por favor, verifica tu conexión o intenta de nuevo.";
    } finally {
      loadingIndicator.style.display = "none";
    }
  });
});
