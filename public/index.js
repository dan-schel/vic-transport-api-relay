/* global window, document, setInterval, fetch, URL, alert */

const acronyms = ["URL", "API", "PTV", "GTFS", "SCS"];

const loading = document.querySelector(".loading");
const report = document.querySelector(".report");
const keyEntry = document.querySelector(".key-entry");
const keyAlert = document.querySelector(".key-alert");
const relayKeyInput = document.querySelector("#relay-key");

let relayKey = "";
let oldRelayKey = "";
let data = null;

relayKeyInput.addEventListener("input", (event) => {
  relayKey = event.target.value;
  const changed = (oldRelayKey.length === 0) !== (relayKey.length === 0);
  oldRelayKey = relayKey;
  if (changed) {
    render(data);
  }
});

setInterval(refresh, 5000);
refresh();

async function refresh() {
  loading.innerHTML = `<p>Loading...</p>`;
  try {
    const response = await fetch("/status.json");
    data = await response.json();

    render(data);

    loading.innerHTML = `<p>Updated ${formatDate(new Date(), false)}</p>`;
  } catch (error) {
    loading.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function render(data) {
  if (data == null) {
    return;
  }

  let html = "";

  html += `<div class="fields"><p>Server startup:</p><p>${formatDate(
    new Date(data.startTime),
  )}</p></div>`;

  keyAlert.style.display = !data.requiresRelayKey ? "block" : "none";
  keyEntry.style.display = data.requiresRelayKey ? "flex" : "none";

  for (const key of Object.keys(data)) {
    if (key === "requiresRelayKey" || key === "startTime") {
      continue;
    }

    const service = data[key];
    if (typeof service === "object") {
      html += formatServiceStatus(key, service);
    }
  }

  report.innerHTML = html;
}

function formatDate(date, showRelative = true) {
  const dateStr = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-AU", {
    timeStyle: "medium",
  }).format(date);
  const weekdayStr = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
  }).format(date);

  if (!showRelative) {
    return `${weekdayStr} ${dateStr} at ${timeStr}`;
  }

  const relative = getRelativeDate(date);
  const relativeStr = new Intl.RelativeTimeFormat("en").format(
    Math.trunc(relative.value),
    relative.unit,
  );

  return `${relativeStr}<br>(${weekdayStr} ${dateStr} at ${timeStr})`;
}

function getRelativeDate(date) {
  const seconds = (date - Date.now()) / 1000;

  if (Math.abs(seconds) < 60) {
    return { value: seconds, unit: "second" };
  } else if (Math.abs(seconds) < 60 * 60) {
    return { value: seconds / 60, unit: "minute" };
  } else if (Math.abs(seconds) < 60 * 60 * 24) {
    return { value: seconds / 60 / 60, unit: "hour" };
  } else {
    return { value: seconds / 60 / 60 / 24, unit: "day" };
  }
}

function formatServiceStatus(serviceName, service) {
  let html = `<div class="service-title"><h2>${titleCase(serviceName)}</h2>`;

  if ("status" in service) {
    html += `<p class="service-status ${service.status}">${sentenceCase(
      service.status,
    )}</p>`;
  }

  html += `</div><div class="fields">`;

  for (const field of Object.keys(service)) {
    const value = service[field];

    if (field === "status") {
      continue;
    }

    html += `<p>${sentenceCase(field)}:</p>`;

    if (value == null) {
      html += `<p><i>&lt;null&gt;</i></p>`;
    } else if (field === "url") {
      const link = relayKey
        ? `<a href="javascript:viewFile('${value}')">${value}</a>`
        : `<a href="${value}">${value}</a>`;

      const downloadButton = relayKey
        ? `<button onClick="downloadFile('${value}')">Download</button>`
        : "";

      html += `<div class="url">${link}${downloadButton}</div>`;
    } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value)) {
      html += `<p>${formatDate(new Date(value))}</p>`;
    } else {
      html += `<p>${value}</p>`;
    }
  }

  html += `</div>`;

  return html;
}

async function withBlobUrl(url, callback) {
  const response = await fetch(url, { headers: { "relay-key": relayKey } });

  if (response.status === 401) {
    alert("Invalid relay key!");
    return;
  } else if (!response.ok) {
    alert("Failed to download file!");
    return;
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  callback(blobUrl);

  URL.revokeObjectURL(blobUrl);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function downloadFile(url) {
  await withBlobUrl(url, (blobUrl) => {
    const fileName = url.split("/").at(-1);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", fileName);
    link.click();
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function viewFile(url) {
  await withBlobUrl(url, (blobUrl) => {
    window.open(blobUrl, "_blank");
  });
}

function splitCamelCase(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function sentenceCase(str) {
  return splitCamelCase(str)
    .split(" ")
    .map((word, i) =>
      capitalizeAcronyms(
        (i === 0
          ? word.charAt(0).toUpperCase()
          : word.charAt(0).toLowerCase()) + word.slice(1),
      ),
    )
    .join(" ");
}

function titleCase(str) {
  return splitCamelCase(str)
    .split(" ")
    .map((word) =>
      capitalizeAcronyms(word.charAt(0).toUpperCase() + word.slice(1)),
    )
    .join(" ");
}

function capitalizeAcronyms(acronym) {
  if (acronyms.includes(acronym.toUpperCase())) {
    return acronym.toUpperCase();
  }
  return acronym;
}
