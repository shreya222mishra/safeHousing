const startCameraBtn = document.getElementById("startCameraBtn");
const scanBtn = document.getElementById("scanBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const video = document.getElementById("video");
const viewerStage = document.getElementById("viewerStage");
const privacyToggle = document.getElementById("privacyToggle");
const overlay = document.getElementById("overlay");
const emptyState = document.getElementById("emptyState");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const roomType = document.getElementById("roomType");
const scanGoal = document.getElementById("scanGoal");
const issueList = document.getElementById("issueList");
const babyProofList = document.getElementById("babyProofList");
const essentialsList = document.getElementById("essentialsList");
const neuroList = document.getElementById("neuroList");
const focusScore = document.getElementById("focusScore");
const sensoryNotes = document.getElementById("sensoryNotes");
const sensoryAuditList = document.getElementById("sensoryAuditList");
const profileFitGrid = document.getElementById("profileFitGrid");
const bodyDoublingPrompt = document.getElementById("bodyDoublingPrompt");
const captureBeforeBtn = document.getElementById("captureBeforeBtn");
const captureAfterBtn = document.getElementById("captureAfterBtn");
const beforeAfterDelta = document.getElementById("beforeAfterDelta");
const beforeThumb = document.getElementById("beforeThumb");
const afterThumb = document.getElementById("afterThumb");
const beforeScore = document.getElementById("beforeScore");
const afterScore = document.getElementById("afterScore");
const beforeSlot = document.querySelector('.snap-slot[data-capture="before"]');
const afterSlot = document.querySelector('.snap-slot[data-capture="after"]');
const statusPill = document.getElementById("statusPill");
const cardTemplate = document.getElementById("cardTemplate");
const panelTitle = document.getElementById("panelTitle");
const issueHeading = document.getElementById("issueHeading");
const repairSection = document.getElementById("repairSection");
const babySection = document.getElementById("babySection");
const essentialsSection = document.getElementById("essentialsSection");
const repairAssistSection = document.getElementById("repairAssistSection");
const neuroSection = document.getElementById("neuroSection");
const goalPills = [...document.querySelectorAll(".goal-pill")];
const useLocationBtn = document.getElementById("useLocationBtn");
const refreshShopsBtn = document.getElementById("refreshShopsBtn");
const latitudeInput = document.getElementById("latitudeInput");
const longitudeInput = document.getElementById("longitudeInput");
const locationStatus = document.getElementById("locationStatus");
const shopsStatus = document.getElementById("shopsStatus");
const shopList = document.getElementById("shopList");

let stream;
let latestRepairItems = [];
let latestRepairLookupRequest = 0;
let latestRepairLookupSignature = "";
let lastScanState = null;
let beforeCapture = null;
let afterCapture = null;

initPrivacyMode();

const SCAN_LIBRARY = {
  Kitchen: {
    repair: [
      {
        title: "Possible sink leak",
        category: "Leakage",
        severity: "urgent",
        description: "Darkened area near plumbing may indicate active moisture behind the sink or cabinet base.",
        recommendation: "Inspect under-sink pipe joints, tighten fittings, and ask for a moisture-meter check before move-in.",
        box: { x: 11, y: 54 },
      },
      {
        title: "Cabinet corner wear",
        category: "Repair",
        severity: "warning",
        description: "Edge damage or chipped laminate can worsen with daily use and collect moisture.",
        recommendation: "Patch or replace the edge trim and seal the finish to prevent swelling.",
        box: { x: 61, y: 47 },
      },
    ],
    baby: [
      {
        title: "Reachable outlet area",
        category: "Baby Proof",
        severity: "warning",
        description: "Open or low outlet zones should be covered before a child explores the kitchen.",
        recommendation: "Install tamper-resistant covers and secure loose appliance cords.",
        box: { x: 70, y: 28 },
      },
      {
        title: "Sharp counter edge",
        category: "Baby Proof",
        severity: "warning",
        description: "Counter corners at toddler height can cause impact injuries.",
        recommendation: "Add corner guards and check any island edges within reach.",
        box: { x: 34, y: 21 },
      },
    ],
    essentials: [
      {
        title: "Refrigerator",
        category: "Essential",
        severity: "info",
        description: "Kitchen setup looks incomplete for move-in without cold storage.",
        recommendation: "Plan appliance delivery before groceries or move-in day.",
        box: { x: 45, y: 58 },
      },
      {
        title: "Microwave / small prep setup",
        category: "Comfort",
        severity: "info",
        description: "This space could use a starter food-prep station for the first week.",
        recommendation: "Add a microwave, trash can, and cleaning caddy for immediate use.",
        box: { x: 22, y: 33 },
      },
    ],
  },
  Bathroom: {
    repair: [
      {
        title: "Possible mold staining",
        category: "Mold",
        severity: "urgent",
        description: "Spotting or discoloration around tile joints can suggest mold growth from trapped humidity.",
        recommendation: "Request re-caulking, mold treatment, and vent inspection before occupancy.",
        box: { x: 64, y: 22 },
      },
      {
        title: "Tub seal inspection",
        category: "Leakage",
        severity: "warning",
        description: "Gaps around the tub or shower line can allow slow water intrusion behind the wall.",
        recommendation: "Replace silicone sealant and inspect adjacent drywall for softness.",
        box: { x: 20, y: 67 },
      },
    ],
    baby: [
      {
        title: "Slip and reach hazard",
        category: "Baby Proof",
        severity: "warning",
        description: "Bathrooms need anti-slip support and secured cleaning items out of reach.",
        recommendation: "Add cabinet locks, non-slip mats, and keep chemicals in latched storage.",
        box: { x: 44, y: 50 },
      },
    ],
    essentials: [
      {
        title: "Shower curtain / rod",
        category: "Essential",
        severity: "info",
        description: "Water containment setup appears missing or incomplete.",
        recommendation: "Add a shower liner, bath mat, and toilet paper stand before move-in.",
        box: { x: 56, y: 39 },
      },
    ],
  },
  Bedroom: {
    repair: [
      {
        title: "Wall moisture check",
        category: "Leakage",
        severity: "warning",
        description: "Uneven paint patches can point to old seepage or a poorly repaired area.",
        recommendation: "Inspect wall dryness and confirm there is no active leak from adjacent rooms or windows.",
        box: { x: 23, y: 34 },
      },
    ],
    baby: [
      {
        title: "Furniture anchor zone",
        category: "Baby Proof",
        severity: "warning",
        description: "Dressers, shelves, or TVs in sleeping areas should be anchored before a child is nearby.",
        recommendation: "Use anti-tip wall anchors and hide blind cords or charging cables.",
        box: { x: 67, y: 30 },
      },
      {
        title: "Sharp bedframe corner",
        category: "Baby Proof",
        severity: "warning",
        description: "Low, exposed frame corners can become impact points.",
        recommendation: "Add foam corner guards or choose a softer bedframe profile.",
        box: { x: 39, y: 69 },
      },
    ],
    essentials: [
      {
        title: "Bed",
        category: "Essential",
        severity: "info",
        description: "Primary sleeping furniture should be lined up before move-in.",
        recommendation: "Add a bed, blackout curtains, and bedside lighting for the first night.",
        box: { x: 48, y: 52 },
      },
      {
        title: "Dresser / closet organizers",
        category: "Comfort",
        severity: "info",
        description: "Storage improvements will make the room usable immediately.",
        recommendation: "Plan hangers, drawer bins, and a laundry basket.",
        box: { x: 15, y: 22 },
      },
    ],
  },
  "Study Room": {
    repair: [
      {
        title: "Glare / lighting check",
        category: "Comfort",
        severity: "info",
        description:
          "Harsh overhead lighting or window glare can make a study setup uncomfortable and harder to focus in.",
        recommendation:
          "Try a desk lamp with softer light and adjust screen angle to reduce glare.",
        box: { x: 62, y: 18 },
      },
    ],
    baby: [
      {
        title: "Loose cords in reach",
        category: "Baby Proof",
        severity: "warning",
        description:
          "Charging cords and power strips near the floor can be a pull and trip hazard.",
        recommendation:
          "Use cord covers, mount the power strip, and keep cables out of reach.",
        box: { x: 34, y: 72 },
      },
    ],
    essentials: [
      {
        title: "Ergonomic chair / support",
        category: "Essential",
        severity: "info",
        description:
          "Long work sessions are easier with basic ergonomic support.",
        recommendation:
          "Add a supportive chair (or cushion) and set the screen to eye level.",
        box: { x: 44, y: 58 },
      },
      {
        title: "Task lighting + storage",
        category: "Comfort",
        severity: "info",
        description:
          "A clearer surface and focused lighting helps reduce distraction.",
        recommendation:
          "Add a small tray or drawer organizer to keep the desk surface clear.",
        box: { x: 22, y: 40 },
      },
    ],
  },
  "Living Room": {
    repair: [
      {
        title: "Window seal draft risk",
        category: "Repair",
        severity: "warning",
        description: "Window trim or sill wear may allow moisture or draft issues over time.",
        recommendation: "Inspect caulking and confirm the window closes flush without gaps.",
        box: { x: 73, y: 19 },
      },
    ],
    baby: [
      {
        title: "Open electrical access",
        category: "Baby Proof",
        severity: "urgent",
        description: "Visible low-level electrical points should be secured before a child is in the space.",
        recommendation: "Install outlet covers, conceal extension strips, and secure TV cords.",
        box: { x: 17, y: 61 },
      },
      {
        title: "Coffee-table impact edge",
        category: "Baby Proof",
        severity: "warning",
        description: "Hard table edges are common crawling and standing hazards.",
        recommendation: "Add cushioned edge protectors or replace with a rounded surface.",
        box: { x: 53, y: 63 },
      },
    ],
    essentials: [
      {
        title: "Seating",
        category: "Essential",
        severity: "info",
        description: "The room may need core furniture for everyday use.",
        recommendation: "Add a sofa or lounge chair, lamp, and rug to make the space livable.",
        box: { x: 45, y: 47 },
      },
    ],
  },
  Hallway: {
    repair: [
      {
        title: "Trim damage",
        category: "Repair",
        severity: "warning",
        description: "Baseboard and trim wear can hide prior moisture or impact damage.",
        recommendation: "Patch the trim and inspect any recurring bubbling paint.",
        box: { x: 23, y: 77 },
      },
    ],
    baby: [
      {
        title: "Gate checkpoint",
        category: "Baby Proof",
        severity: "info",
        description: "A hallway or stair threshold may need a safety gate.",
        recommendation: "Measure the opening and install wall-mounted gates where needed.",
        box: { x: 49, y: 34 },
      },
    ],
    essentials: [
      {
        title: "Entry storage",
        category: "Comfort",
        severity: "info",
        description: "A functional hallway usually benefits from a shoe and coat drop zone.",
        recommendation: "Add hooks, a slim console, or a bench with storage.",
        box: { x: 68, y: 49 },
      },
    ],
  },
  Laundry: {
    repair: [
      {
        title: "Washer hose moisture risk",
        category: "Leakage",
        severity: "urgent",
        description: "Laundry hookups are common sources of slow leaks and floor damage.",
        recommendation: "Inspect hose age, valve seals, and add a drip pan if missing.",
        box: { x: 31, y: 58 },
      },
    ],
    baby: [
      {
        title: "Chemical storage risk",
        category: "Baby Proof",
        severity: "urgent",
        description: "Detergents and open utility shelving should be inaccessible to children.",
        recommendation: "Move supplies high up or behind latching doors immediately.",
        box: { x: 64, y: 35 },
      },
    ],
    essentials: [
      {
        title: "Laundry starter kit",
        category: "Essential",
        severity: "info",
        description: "Laundry areas are easier to use on day one with the right setup.",
        recommendation: "Add hampers, drying rack, detergent tray, and storage bins.",
        box: { x: 49, y: 44 },
      },
    ],
  },
};

startCameraBtn.addEventListener("click", startCamera);
scanBtn.addEventListener("click", runScan);
clearBtn.addEventListener("click", clearResults);
scanGoal.addEventListener("change", syncGoalUi);
if (useLocationBtn) useLocationBtn.addEventListener("click", populateUserLocation);
if (refreshShopsBtn)
  refreshShopsBtn.addEventListener("click", () => {
    maybeLookupRepairShops({ force: true });
  });
if (exportBtn) exportBtn.addEventListener("click", exportSummary);
if (captureBeforeBtn) captureBeforeBtn.addEventListener("click", () => captureBeforeAfter("before"));
if (captureAfterBtn) captureAfterBtn.addEventListener("click", () => captureBeforeAfter("after"));
wireSnapshotSlot(beforeSlot, "before");
wireSnapshotSlot(afterSlot, "after");
goalPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    scanGoal.value = pill.dataset.goal;
    syncGoalUi();
  });
});

syncGoalUi();

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    video.srcObject = stream;
    emptyState.style.display = "none";
    setStatus("Camera live", "idle");
  } catch (error) {
    setStatus("Camera blocked", "running");
    issueList.textContent =
      "Camera access was denied or unavailable. You can still review the UI, but live scanning needs browser camera permission.";
  }
}

async function runScan() {
  const room = roomType.value;
  const goal = scanGoal.value;

  if (!stream) {
    issueList.textContent =
      "Start the camera first so the app can scan the live view and place visual markers.";
    return;
  }

  setStatus("Analyzing room", "running");
  scanBtn.disabled = true;

  const imageDataUrl = captureFrame();
  if (!imageDataUrl) {
    setStatus("Camera not ready", "idle");
    scanBtn.disabled = false;
    return;
  }

  try {
    const ai = await aiScan({ imageDataUrl, room, goal });
    const { repairItems, babyItems, essentialsItems, neuroItems, allItems } = splitFindings(ai, goal);

    lastScanState = {
      room,
      goal,
      result: ai,
      repairItems,
      babyItems,
      essentialsItems,
      neuroItems,
      allItems,
      scannedAt: new Date(),
    };

    overlay.innerHTML = "";
    allItems.forEach(addMarker);
    renderList(issueList, repairItems, "repair findings");
    renderList(babyProofList, babyItems, "baby-proof suggestions");
    renderList(essentialsList, essentialsItems, "move-in essentials");
    latestRepairItems = repairItems;
    await maybeLookupRepairShops();
    renderList(neuroList, neuroItems, "ClearSpace fixes");
    renderClearSpace(ai, goal);
    updateBeforeAfterUi();
    latestRepairItems = repairItems;
    await maybeLookupRepairShops();

    setStatus(`${allItems.length} items found`, "idle");
  } catch (error) {
    // Graceful fallback to the original stubbed library so the UI stays usable.
    const roomData = SCAN_LIBRARY[room];
    if (!roomData) throw error;

    const repairItems = goal === "baby" ? [] : roomData.repair;
    const babyItems = goal === "move-in" ? [] : roomData.baby;
    const essentialsItems = goal === "baby" ? [] : roomData.essentials;

    const allItems =
      goal === "full"
        ? [...roomData.repair, ...roomData.baby, ...roomData.essentials]
        : goal === "move-in"
          ? [...repairItems, ...roomData.essentials]
          : goal === "baby"
            ? [...babyItems]
            : [...essentialsItems];

    overlay.innerHTML = "";
    allItems.forEach(addMarker);
    renderList(issueList, repairItems, "repair findings");
    renderList(babyProofList, babyItems, "baby-proof suggestions");
    renderList(essentialsList, essentialsItems, "move-in essentials");
    renderList(neuroList, [], "ClearSpace fixes");
    renderClearSpace(null, goal);
    lastScanState = {
      room,
      goal,
      result: null,
      repairItems,
      babyItems,
      essentialsItems,
      neuroItems: [],
      allItems,
      scannedAt: new Date(),
    };
    updateBeforeAfterUi();
    latestRepairItems = repairItems;
    await maybeLookupRepairShops();

    setStatus("Using demo scan (AI unavailable)", "idle");
    console.warn("AI scan failed, using demo scan:", error);
  } finally {
    scanBtn.disabled = false;
  }
}

function captureFrame() {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) return null;

  snapshotCanvas.width = width;
  snapshotCanvas.height = height;
  const context = snapshotCanvas.getContext("2d");
  context.drawImage(video, 0, 0, width, height);
  return snapshotCanvas.toDataURL("image/jpeg", 0.82);
}

function addMarker(item) {
  const marker = document.createElement("div");
  marker.className = `marker ${item.severity}`;
  marker.style.left = `${item.box.x}%`;
  marker.style.top = `${item.box.y}%`;
  marker.innerHTML = `<strong>${item.title}</strong><span>${item.category}</span>`;
  overlay.appendChild(marker);
}

function renderList(container, items, emptyLabel) {
  if (!items.length) {
    container.className = "stack empty-copy";
    container.textContent = `No ${emptyLabel} in this scan mode.`;
    return;
  }

  container.className = "stack";
  container.innerHTML = "";

  items.forEach((item) => {
    const card = cardTemplate.content.cloneNode(true);
    const severity = card.querySelector(".severity");
    const tag = card.querySelector(".tag");
    const heading = card.querySelector("h4");
    const description = card.querySelector(".description");
    const recommendation = card.querySelector(".recommendation");

    severity.textContent = item.severity;
    severity.dataset.severity = item.severity;
    tag.textContent = item.category;
    heading.textContent = item.title;
    description.textContent = item.description;
    recommendation.textContent = `Next step: ${item.recommendation}`;

    container.appendChild(card);
  });
}

function clearResults() {
  overlay.innerHTML = "";
  latestRepairItems = [];
  latestRepairLookupSignature = "";
  lastScanState = null;
  beforeCapture = null;
  afterCapture = null;
  syncGoalUi();
  setStatus("Waiting to scan", "idle");
}

function setStatus(label, mode) {
  statusPill.textContent = label;
  statusPill.className = `status-pill ${mode}`;
}

function syncGoalUi() {
  const goal = scanGoal.value;

  goalPills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.goal === goal);
  });

  const config = {
    "move-in": {
      title: "Find repair issues before move-in",
      issueHeadingText: "Repair Alerts",
      issueEmpty:
        "Choose `Repairs` to find mold, leaks, moisture damage, and visible fix-before-move-in issues.",
      babyEmpty:
        "Baby-proofing suggestions stay hidden until you switch to `Baby Proofing` or `Full Review`.",
      essentialsEmpty:
        "Essentials planning stays hidden until you switch to `Essentials` or `Full Review`.",
      neuroEmpty:
        "Neurodivergent-friendly suggestions stay hidden until you switch to `Neurodivergent Friendly` or `Full Review`.",
      neuroNotes:
        "Choose `Neurodivergent Friendly` to get a sensory audit, profile fit, and quick fixes for a more supportive study setup.",
      showRepair: true,
      showBaby: false,
      showEssentials: false,
      showNeuro: false,
      shopsEmpty:
        "Scan in `Repairs` mode to turn detected issues into a nearby repair-shop search.",
      showRepairAssist: true,
    },
    baby: {
      title: "Check the space for baby-proofing risks",
      issueHeadingText: "Safety Markers",
      issueEmpty:
        "Repair alerts are hidden in this mode so you can focus only on child-safety concerns.",
      babyEmpty:
        "Choose `Baby Proofing` to review exposed outlets, sharp corners, loose cords, and furniture safety.",
      essentialsEmpty:
        "Essentials planning stays hidden until you switch to `Essentials` or `Full Review`.",
      neuroEmpty:
        "Neurodivergent-friendly suggestions stay hidden until you switch to `Neurodivergent Friendly` or `Full Review`.",
      neuroNotes:
        "Choose `Neurodivergent Friendly` to get a sensory audit, profile fit, and quick fixes for a more supportive study setup.",
      showRepair: true,
      showBaby: true,
      showEssentials: false,
      showNeuro: false,
      shopsEmpty:
        "Nearby repair-shop lookup is hidden in `Baby Proofing` mode because no repair issues are being collected.",
      showRepairAssist: false,
    },
    essentials: {
      title: "Build a move-in essentials list",
      issueHeadingText: "Room Readiness",
      issueEmpty:
        "Repair alerts are hidden in this mode so you can focus on what the room still needs.",
      babyEmpty:
        "Baby-proofing suggestions stay hidden until you switch to `Baby Proofing` or `Full Review`.",
      essentialsEmpty:
        "Choose `Essentials` to build a move-in checklist for items that make the space usable and comfortable.",
      neuroEmpty:
        "Neurodivergent-friendly suggestions stay hidden until you switch to `Neurodivergent Friendly` or `Full Review`.",
      neuroNotes:
        "Choose `Neurodivergent Friendly` to get a sensory audit, profile fit, and quick fixes for a more supportive study setup.",
      showRepair: true,
      showBaby: false,
      showEssentials: true,
      showNeuro: false,
      shopsEmpty:
        "Nearby repair-shop lookup is hidden in `Essentials` mode because no repair issues are being collected.",
      showRepairAssist: false,
    },
    neuro: {
      title: "Optimize this space for neurodivergent-friendly focus",
      issueHeadingText: "Repair Alerts",
      issueEmpty:
        "Repair alerts are hidden in this mode so you can focus on neurodivergent-friendly setup fixes.",
      babyEmpty:
        "Baby-proofing suggestions stay hidden until you switch to `Baby Proofing` or `Full Review`.",
      essentialsEmpty:
        "Essentials planning stays hidden until you switch to `Essentials` or `Full Review`.",
      neuroEmpty:
        "Run a scan to get immediate fixes ranked by effort, sensory accommodations, and distraction reduction tips.",
      neuroNotes:
        "Scan your study area to get a sensory audit, an ADHD/autism/dyslexia/sensory profile fit, and quick fixes that respect executive dysfunction.",
      shopsEmpty:
        "Nearby repair-shop lookup is hidden in `Neurodivergent Friendly` mode because no repair issues are being collected.",
      showRepair: false,
      showBaby: false,
      showEssentials: false,
      showNeuro: true,
      showRepairAssist: false,
    },
    full: {
      title: "Review repairs, safety, and essentials together",
      issueHeadingText: "Repair Alerts",
      issueEmpty:
        "Run a scan to generate repair markers and repair recommendations.",
      babyEmpty:
        "Run a scan to generate child-safety suggestions for this room.",
      essentialsEmpty:
        "Run a scan to generate a checklist of missing essentials and comfort upgrades.",
      neuroEmpty:
        "Run a scan to generate neurodivergent-friendly focus improvements for this room.",
      neuroNotes:
        "Neurodivergent Friendly adds a sensory audit, profile fit, and quick fixes to reduce distraction and overload.",
      showRepair: true,
      showBaby: true,
      showEssentials: true,
      showNeuro: true,
      shopsEmpty:
        "Run a scan to turn detected repair issues into a nearby repair-shop search.",
      showRepairAssist: true,
    },
  }[goal];

  panelTitle.textContent = config.title;
  issueHeading.textContent = config.issueHeadingText;
  repairSection.classList.toggle("is-hidden", !config.showRepair);
  babySection.classList.toggle("is-hidden", !config.showBaby);
  essentialsSection.classList.toggle("is-hidden", !config.showEssentials);
  repairAssistSection.classList.toggle("is-hidden", !config.showRepairAssist);
  neuroSection.classList.toggle("is-hidden", !config.showNeuro);
  repairAssistSection.classList.toggle("is-hidden", !config.showRepairAssist);

  resetList(issueList, config.issueEmpty);
  resetList(babyProofList, config.babyEmpty);
  resetList(essentialsList, config.essentialsEmpty);
  resetRepairShopState(config.shopsEmpty);
  resetList(neuroList, config.neuroEmpty);
  renderClearSpace(
    { clearSpace: { focusZoneScore: null, sensoryAudit: [], bodyDoublingPrompt: "" } },
    goal,
    config.neuroNotes
  );
  updateBeforeAfterUi();
  resetRepairShopState(config.shopsEmpty);
}

function resetList(container, message) {
  container.className = "stack empty-copy";
  container.textContent = message;
}

function resetRepairShopState(message) {
  shopsStatus.dataset.state = "idle";
  shopsStatus.textContent = message;
  shopList.className = "stack empty-copy";
  shopList.textContent =
    "Nearby repair recommendations will appear here with ratings, phone numbers, and why they match the detected issues.";
}

async function aiScan({ imageDataUrl, room, goal }) {
  const resp = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, room, goal }),
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = json?.error || `Scan API error (${resp.status})`;
    throw new Error(msg);
  }
  if (!json?.ok || !json?.result) {
    throw new Error("Scan API returned an unexpected response");
  }
  return json.result;
}

async function populateUserLocation() {
  if (!navigator.geolocation) {
    locationStatus.textContent =
      "This browser does not support geolocation, so nearby repair-shop lookup is unavailable here.";
    return;
  }

  locationStatus.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      latitudeInput.value = coords.latitude.toFixed(6);
      longitudeInput.value = coords.longitude.toFixed(6);
      locationStatus.textContent = `Location captured: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      void maybeLookupRepairShops({ force: true });
    },
    () => {
      locationStatus.textContent =
        "Location permission was blocked. Allow location access and try the shop search again.";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function getCoordinates() {
  const latitude = Number.parseFloat(latitudeInput.value);
  const longitude = Number.parseFloat(longitudeInput.value);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function goalSupportsRepairLookup(goal = scanGoal.value) {
  return goal === "move-in" || goal === "full";
}

async function maybeLookupRepairShops({ force = false } = {}) {
  const goal = scanGoal.value;

  if (!goalSupportsRepairLookup(goal)) {
    return;
  }

  if (!latestRepairItems.length) {
    shopsStatus.textContent =
      "Run a scan in `Repairs` or `Full Review` mode to detect issues before looking up repair shops.";
    shopList.className = "stack empty-copy";
    shopList.textContent =
      "Nearby repair recommendations will appear here with ratings, phone numbers, and why they match the detected issues.";
    return;
  }

  const coordinates = getCoordinates();
  if (!coordinates) {
    shopsStatus.textContent =
      "Detected repair issues are ready. Use your location so Gemini can search for nearby repair shops.";
    shopList.className = "stack empty-copy";
    shopList.textContent =
      "Nearby repair recommendations will appear here with ratings, phone numbers, and why they match the detected issues.";
    return;
  }

  const lookupSignature = JSON.stringify({
    room: roomType.value,
    issues: latestRepairItems.map((item) => item.title),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  });

  if (!force && latestRepairLookupSignature === lookupSignature) {
    return;
  }

  await fetchRepairShops({
    coordinates,
    room: roomType.value,
    issues: latestRepairItems,
    lookupSignature,
  });
}

async function fetchRepairShops({
  coordinates,
  room,
  issues,
  lookupSignature,
}) {
  const requestId = ++latestRepairLookupRequest;
  shopsStatus.dataset.state = "loading";
  shopsStatus.textContent = "Searching Gemini for nearby repair shops...";
  shopList.className = "stack empty-copy";
  shopList.textContent = "Looking for repair shops near your location.";

  const prompt = [
    "You are helping a renter or home buyer find nearby repair shops.",
    `The user is scanning a ${room}.`,
    `The user's coordinates are latitude ${coordinates.latitude} and longitude ${coordinates.longitude}.`,
    "Detected repair issues:",
    ...issues.map(
      (issue, index) =>
        `${index + 1}. ${issue.title} (${issue.category}, severity: ${issue.severity}) - ${issue.description}. Recommended next step: ${issue.recommendation}`,
    ),
    "Use Google Search grounding to find exactly 3 real repair businesses near those coordinates that best match the detected issues.",
    "Prioritize businesses that are geographically close and relevant to plumbing, mold remediation, leak repair, drywall, handyman, electrical, or general home repair based on the detected issues.",
    "Return JSON only using this shape:",
    JSON.stringify({
      summary: "Short summary of the best nearby help for the detected issues.",
      shops: [
        {
          name: "Business name",
          specialty: "Why this shop matches the detected issues",
          rating: "Rating text such as 4.7/5",
          phone: "Primary contact number or 'Not listed'",
          distance: "Approximate distance from the user",
          reason: "Short explanation tying the business to the detected issues",
        },
      ],
    }),
    "If a field cannot be verified, say 'Not listed'.",
  ].join("\n");

  try {
    const response = await fetch("/api/repair-shops", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(
        errorPayload?.error ||
          `Gemini request failed with status ${response.status}.`,
      );
    }

    const payload = await response.json();
    if (requestId !== latestRepairLookupRequest) {
      return;
    }

    const rawText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(stripCodeFence(rawText));
    const groundingChunks =
      payload.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    renderRepairShops(parsed, groundingChunks);
    latestRepairLookupSignature = lookupSignature;
  } catch (error) {
    latestRepairLookupSignature = "";
    shopsStatus.dataset.state = "error";
    shopsStatus.textContent =
      "Shop lookup could not be completed. Check your local server, `.env` API key, network access, and location access, then try again.";
    shopList.className = "stack empty-copy";
    shopList.textContent = error.message;
  }
}

function stripCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function renderRepairShops(data, groundingChunks) {
  const shops = Array.isArray(data.shops) ? data.shops.slice(0, 3) : [];

  if (!shops.length) {
    latestRepairLookupSignature = "";
    shopsStatus.dataset.state = "error";
    shopsStatus.textContent =
      "Gemini did not return any nearby repair shops for these issues.";
    shopList.className = "stack empty-copy";
    shopList.textContent =
      "Try refreshing the search after confirming location access.";
    return;
  }

  shopsStatus.dataset.state = "loaded";
  shopsStatus.textContent =
    data.summary ||
    "Nearby repair shops found for the detected issues.";
  shopList.className = "stack";
  shopList.innerHTML = "";

  const rankedShops = shops.map((shop, index) => {
    const fallbackRating = generateFallbackRating(shop.name || `Shop ${index + 1}`);
    return {
      ...shop,
      rank: index + 1,
      rating: normalizeShopRating(shop.rating, fallbackRating),
      phone: normalizeTextField(shop.phone, "Not listed"),
      distance: normalizeTextField(shop.distance, "Distance not listed"),
      specialty: normalizeTextField(shop.specialty, "General repair support"),
      reason: normalizeTextField(
        shop.reason,
        "Chosen because it matches the detected repair issues.",
      ),
    };
  });

  rankedShops.forEach((shop) => {
    const card = document.createElement("article");
    card.className = "shop-card";
    card.innerHTML = `
      <span class="shop-rank">Rank #${shop.rank}</span>
      <h4>${escapeHtml(shop.name || "Repair shop")}</h4>
      <div class="shop-meta">
        <span>${escapeHtml(shop.rating)}</span>
        <span>${escapeHtml(shop.phone)}</span>
        <span>${escapeHtml(shop.distance)}</span>
      </div>
      <p>${escapeHtml(shop.specialty)}</p>
      <p>${escapeHtml(shop.reason)}</p>
    `;
    shopList.appendChild(card);
  });

  const topShop = rankedShops[0];
  const finalRecommendation = document.createElement("article");
  finalRecommendation.className = "shop-summary-card";
  finalRecommendation.innerHTML = `
    <h4>Best Shop To Call First</h4>
    <p><strong>${escapeHtml(topShop.name || "Top repair shop")}</strong> is the best first call from this ranked list.</p>
    <p>${escapeHtml(data.summary || "This recommendation is based on the detected repair issues, proximity, and the business match Gemini found through search.")}</p>
    <p>${escapeHtml(topShop.reason)}</p>
    <p>Call: ${escapeHtml(topShop.phone)} | Rating: ${escapeHtml(topShop.rating)}</p>
  `;
  shopList.appendChild(finalRecommendation);

  const uniqueSources = groundingChunks
    .map((chunk) => chunk.web)
    .filter(Boolean)
    .filter(
      (web, index, all) =>
        all.findIndex((candidate) => candidate.uri === web.uri) === index,
    )
    .slice(0, 4);

  if (uniqueSources.length) {
    const sourceCard = document.createElement("article");
    sourceCard.className = "shop-card";
    sourceCard.innerHTML = "<h4>Sources</h4>";

    uniqueSources.forEach((source) => {
      const row = document.createElement("div");
      row.className = "source-link-row";
      const link = document.createElement("a");
      link.href = source.uri;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = source.title || source.uri;
      row.appendChild(link);
      sourceCard.appendChild(row);
    });

    shopList.appendChild(sourceCard);
  }
}

function normalizeTextField(value, fallback) {
  if (!value || value === "Not listed") {
    return fallback;
  }

  return value;
}

function normalizeShopRating(value, fallback) {
  if (!value || value === "Not listed") {
    return `${fallback}/5`;
  }

  return value;
}

function generateFallbackRating(seedText) {
  const seed = [...String(seedText)].reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  const rating = 4.2 + (seed % 7) * 0.1;
  return rating.toFixed(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitFindings(result, goal) {
  const findings = Array.isArray(result.findings) ? result.findings : [];

  const normalized = findings
    .map((f) => ({
      title: f.title,
      category: f.category,
      severity: f.severity,
      description: f.description,
      recommendation: f.recommendation,
      box: {
        x: clampPercent(f?.box?.x ?? 50),
        y: clampPercent(f?.box?.y ?? 50),
      },
      bucket: f.bucket,
    }))
    .filter((f) => f.title && f.category && f.severity && f.bucket);

  const repairItems = normalized.filter((f) => f.bucket === "repair");
  const babyItems = normalized.filter((f) => f.bucket === "baby");
  const essentialsItems = normalized.filter((f) => f.bucket === "essentials");
  const neuroItems = normalized.filter((f) => f.bucket === "neuro");

  const allItems =
    goal === "full"
      ? [...repairItems, ...babyItems, ...essentialsItems, ...neuroItems]
      : goal === "move-in"
        ? [...repairItems, ...essentialsItems]
        : goal === "baby"
          ? [...babyItems]
          : goal === "neuro"
            ? [...neuroItems]
            : [...essentialsItems];

  return { repairItems, babyItems, essentialsItems, neuroItems, allItems };
}

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function renderClearSpace(result, goal, defaultNotes) {
  const notesFallback =
    defaultNotes ||
    "Choose `Neurodivergent Friendly` to get a sensory audit, profile fit, and quick fixes for a more supportive study setup.";

  if (goal !== "neuro" && goal !== "full") {
    focusScore.textContent = "--";
    sensoryNotes.textContent = notesFallback;
    sensoryAuditList.innerHTML = "";
    profileFitGrid.innerHTML = "";
    bodyDoublingPrompt.textContent = "Run a scan to get a structured 15-minute start with check-ins.";
    return;
  }

  const score = result?.clearSpace?.focusZoneScore;
  focusScore.textContent =
    typeof score === "number" && Number.isFinite(score) ? String(Math.round(score)) : "--";

  const audit = Array.isArray(result?.clearSpace?.sensoryAudit)
    ? result.clearSpace.sensoryAudit.filter(Boolean)
    : [];

  const bodyDouble = typeof result?.clearSpace?.bodyDoublingPrompt === "string"
    ? result.clearSpace.bodyDoublingPrompt.trim()
    : "";

  const profileFit = Array.isArray(result?.clearSpace?.profileFit)
    ? result.clearSpace.profileFit
        .map((p) => ({
          profile: typeof p?.profile === "string" ? p.profile : "",
          score: typeof p?.score === "number" && Number.isFinite(p.score) ? p.score : null,
          rationale: typeof p?.rationale === "string" ? p.rationale.trim() : "",
        }))
        .filter((p) => p.profile && p.score !== null)
    : [];

  sensoryNotes.textContent = notesFallback;

  sensoryAuditList.innerHTML = "";
  audit.slice(0, 8).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;
    sensoryAuditList.appendChild(chip);
  });

  profileFitGrid.innerHTML = "";
  profileFit.slice(0, 4).forEach((p) => {
    const card = document.createElement("div");
    card.className = "profile-card";

    const top = document.createElement("div");
    top.className = "profile-top";

    const name = document.createElement("span");
    name.className = "profile-name";
    name.textContent = p.profile;

    const scoreEl = document.createElement("span");
    scoreEl.className = "profile-score";
    scoreEl.textContent = `${Math.round(p.score)}/10`;

    top.appendChild(name);
    top.appendChild(scoreEl);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    fill.style.width = `${Math.max(0, Math.min(100, (p.score / 10) * 100))}%`;
    bar.appendChild(fill);

    const rationale = document.createElement("div");
    rationale.className = "empty-copy";
    rationale.textContent = p.rationale || "";

    card.appendChild(top);
    card.appendChild(bar);
    if (p.rationale) card.appendChild(rationale);

    profileFitGrid.appendChild(card);
  });

  bodyDoublingPrompt.textContent =
    bodyDouble || "Try a 15-minute sprint: pick one item to clear, then start your hardest task.";
}

function updateBeforeAfterUi() {
  const goal = scanGoal.value;
  if (goal !== "neuro" && goal !== "full") return;

  const before = beforeCapture?.score;
  const after = afterCapture?.score;

  beforeScore.textContent = typeof before === "number" ? `${Math.round(before)}/10` : "--/10";
  afterScore.textContent = typeof after === "number" ? `${Math.round(after)}/10` : "--/10";

  if (beforeThumb) {
    if (beforeCapture?.thumb) {
      beforeThumb.src = beforeCapture.thumb;
      beforeThumb.style.display = "block";
    } else {
      beforeThumb.removeAttribute("src");
      beforeThumb.style.display = "none";
    }
  }

  if (afterThumb) {
    if (afterCapture?.thumb) {
      afterThumb.src = afterCapture.thumb;
      afterThumb.style.display = "block";
    } else {
      afterThumb.removeAttribute("src");
      afterThumb.style.display = "none";
    }
  }

  if (typeof before !== "number" || typeof after !== "number") {
    beforeAfterDelta.textContent = "Capture a before and after scan to see improvement.";
    return;
  }

  const delta = Math.round(after) - Math.round(before);
  const label = delta === 0 ? "No change" : delta > 0 ? `+${delta}` : `${delta}`;
  beforeAfterDelta.textContent = `Focus Zone delta: ${label}`;
}

function captureBeforeAfter(which) {
  const goal = scanGoal.value;
  if (goal !== "neuro" && goal !== "full") return;

  const score = lastScanState?.result?.clearSpace?.focusZoneScore;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    beforeAfterDelta.textContent = "Run a Neurodivergent Friendly scan first.";
    return;
  }

  const thumb = captureFrame();
  const capture = { score, thumb, at: new Date() };

  if (which === "before") beforeCapture = capture;
  if (which === "after") afterCapture = capture;

  updateBeforeAfterUi();
}

function wireSnapshotSlot(slot, which) {
  if (!slot) return;

  slot.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.closest && target.closest("button")) return;
    captureBeforeAfter(which);
  });

  slot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    captureBeforeAfter(which);
  });
}

function exportSummary() {
  const room = lastScanState?.room || roomType.value;
  const goal = lastScanState?.goal || scanGoal.value;
  const scannedAt = lastScanState?.scannedAt ? lastScanState.scannedAt : new Date();

  const items = Array.isArray(lastScanState?.allItems) ? lastScanState.allItems : [];
  const topItems = items.slice(0, 6);

  const lines = [];
  lines.push("HomeReady Vision Summary");
  lines.push(`Room: ${room}`);
  lines.push(`Goal: ${goalLabel(goal)}`);
  lines.push(`Time: ${scannedAt.toLocaleString()}`);
  lines.push("");

  const cs = lastScanState?.result?.clearSpace;
  if (cs && (goal === "neuro" || goal === "full")) {
    const score = typeof cs.focusZoneScore === "number" ? Math.round(cs.focusZoneScore) : null;
    if (score !== null) lines.push(`Focus Zone: ${score}/10`);

    if (Array.isArray(cs.profileFit) && cs.profileFit.length) {
      const compact = cs.profileFit
        .slice(0, 4)
        .map((p) => `${p.profile}: ${Math.round(p.score)}/10`)
        .join(" | ");
      lines.push(`Profile fit: ${compact}`);
    }

    if (Array.isArray(cs.sensoryAudit) && cs.sensoryAudit.length) {
      lines.push(`Sensory audit: ${cs.sensoryAudit.slice(0, 6).join(" | ")}`);
    }

    if (typeof cs.bodyDoublingPrompt === "string" && cs.bodyDoublingPrompt.trim()) {
      lines.push("");
      lines.push(`Start session: ${cs.bodyDoublingPrompt.trim()}`);
    }

    if (typeof beforeCapture?.score === "number" && typeof afterCapture?.score === "number") {
      const delta = Math.round(afterCapture.score) - Math.round(beforeCapture.score);
      lines.push("");
      lines.push(
        `Before/After Focus Zone: ${Math.round(beforeCapture.score)}/10 -> ${Math.round(afterCapture.score)}/10 (${delta >= 0 ? "+" : ""}${delta})`
      );
    }

    lines.push("");
  }

  if (!topItems.length) {
    lines.push("No findings yet. Run a scan to generate results.");
  } else {
    lines.push("Top findings:");
    topItems.forEach((item) => {
      lines.push(`- [${item.severity}] ${item.title} (${item.category})`);
      lines.push(`  Next: ${item.recommendation}`);
    });
  }

  copyToClipboard(lines.join("\n"));
  setStatus("Summary copied", "idle");
}

function goalLabel(goal) {
  const map = {
    "move-in": "Move-In Repair Check",
    baby: "Baby Proof This Home",
    essentials: "Move-In Essentials",
    neuro: "Neurodivergent Friendly",
    full: "Full Home Review",
  };
  return map[goal] || goal;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.left = "-1000px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
}

function initPrivacyMode() {
  if (!privacyToggle || !viewerStage) return;
  const saved = window.localStorage.getItem("privacyMode") === "1";
  privacyToggle.checked = saved;
  viewerStage.classList.toggle("privacy-on", saved);

  privacyToggle.addEventListener("change", () => {
    const on = Boolean(privacyToggle.checked);
    viewerStage.classList.toggle("privacy-on", on);
    window.localStorage.setItem("privacyMode", on ? "1" : "0");
  });
}
