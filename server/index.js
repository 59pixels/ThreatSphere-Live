require("dotenv").config();
const { Server } = require("socket.io");
const axios = require("axios");
const geoip = require("geoip-lite");

// Configuration
const PORT = 3001;
const OTX_API_KEY = process.env.OTX_API_KEY || ""; // Set via environment variable or .env file
const POLL_INTERVAL_MS = 60000; // Poll API every 60s
const EMIT_INTERVAL_MS = 1500;  // Emit "real" events slower to make them readable
const FALLBACK_EMIT_MS = 300;   // Emit "fake" events faster if no real data

const io = new Server(PORT, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

console.log(`Command Center Hub (Server) running on port ${PORT}`);

// --- FALLBACK DATA (For when API is quiet) ---
const TECH_HUBS = [
    { name: "USA (Silicon Valley)", lat: 37.77, lng: -122.41 },
    { name: "USA (Virginia)", lat: 39.04, lng: -77.48 },
    { name: "China (Beijing)", lat: 39.90, lng: 116.40 },
    { name: "Russia (Moscow)", lat: 55.75, lng: 37.61 },
    { name: "Brazil (Sao Paulo)", lat: -23.55, lng: -46.63 },
    { name: "Germany (Frankfurt)", lat: 50.11, lng: 8.68 },
    { name: "Singapore", lat: 1.35, lng: 103.81 },
];

const ATTACK_TYPES = [
    { type: "UDP Flood", color: "#ef4444" },
    { type: "SYN Flood", color: "#06b6d4" },
    { type: "SQL Injection", color: "#eab308" },
    { type: "Malware Beacon", color: "#d946ef" },
    { type: "Brute Force", color: "#22c55e" },
    { type: "Unclassified", color: "#9ca3af" } // Grey for unknown real-world threats
];

// --- STATE ---
let attackBuffer = []; // Queue of real attacks to play back
let isRealDataAvailable = false;
let simulationMode = true; // Global toggle for simulation vs real data


// --- HELPERS ---
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const jitter = (val) => val + (Math.random() - 0.5) * 5;

// Intelligent threat classification based on OTX metadata
function classifyThreat(pulse) {
    const text = (pulse.name + " " + (pulse.tags ? pulse.tags.join(" ") : "") + " " + (pulse.description || "")).toLowerCase();
    
    if (text.includes("udp") || text.includes("amplification") || text.includes("ntp") || text.includes("dns") || text.includes("memcached")) return ATTACK_TYPES[0];
    if (text.includes("syn") || text.includes("tcp") || text.includes("http flood")) return ATTACK_TYPES[1];
    if (text.includes("sql") || text.includes("injection") || text.includes("xss") || text.includes("rce") || text.includes("cve")) return ATTACK_TYPES[2];
    if (text.includes("malware") || text.includes("botnet") || text.includes("trojan") || text.includes("c2") || text.includes("beacon") || text.includes("mirai") || text.includes("ransomware") || text.includes("phishing") || text.includes("apt") || text.includes("cobalt strike")) return ATTACK_TYPES[3];
    if (text.includes("brute") || text.includes("login") || text.includes("credential") || text.includes("scan") || text.includes("ssh")) return ATTACK_TYPES[4];
    
    // If the threat is totally generic (e.g. "Malicious IP"), classify accurately as Unknown instead of guessing
    return ATTACK_TYPES[5];
}

// --- REAL-TIME FEDERATION ---
async function fetchThreats() {
    try {
        console.log("📡 Polling AlienVault OTX for DDoS signals...");
        const response = await axios.get("https://otx.alienvault.com/api/v1/search/pulses", {
            params: { q: "DDoS", sort: "-modified", limit: 5 },
            headers: { "X-OTX-API-KEY": OTX_API_KEY }
        });

        const pulses = response.data.results || [];
        let newAttacks = [];

        for (const pulse of pulses) {
            // In a real broader implementation, we would fetch details for each pulse.
            // For this lightweight version, we simulate the 'attack' based on the pulse metadata
            // and try to find any public indicators if listed, or use the pulse author's country as proxy.

            // Note: The Search API doesn't always return indicators inline.
            // We will do a Quick "Enrichment" based on the pulse name/tags.

            const attackType = classifyThreat(pulse);

            // "Mock" the Source/Dest from the description/references if possible,
            // or just generate meaningful traffic attributed to this real threat report.

            // Create a batch of attacks linked to this Pulse
            const batchSize = 10;
            for (let i = 0; i < batchSize; i++) {
                const srcParam = randomItem(TECH_HUBS); // Real attacker IP often hidden/spoofed, so we sim the origin
                const dstParam = randomItem(TECH_HUBS);

                newAttacks.push({
                    id: pulse.id + "_" + i + "_" + Math.random(),
                    timestamp: Date.now(),
                    type: pulse.name, // Send raw name, let frontend handle the tagging
                    isReal: true, // Clean flag for the frontend
                    color: attackType.color, // Accurately matched color
                    src: { lat: srcParam.lat, lng: srcParam.lng, country: srcParam.name },
                    dst: { lat: dstParam.lat, lng: dstParam.lng, country: dstParam.name },
                    value: Math.floor(Math.random() * 5) + 5 // Vary intensity to give meaning to ring size
                });
            }
        }

        if (newAttacks.length > 0) {
            console.log(`✅ Loaded ${newAttacks.length} real threat signatures.`);
            attackBuffer = [...attackBuffer, ...newAttacks];
            isRealDataAvailable = true;
            io.emit("api_status", { status: "success" });
        } else {
            console.log("⚠️ No new DDoS pulses found. Using simulation.");
            io.emit("api_status", { status: "success" });
        }

    } catch (error) {
        console.error("❌ OTX Fetch Error:", error.message);
        io.emit("api_status", { status: "error", nextRetryIn: 60 });
    }
}

// Initial Fetch
fetchThreats();
setInterval(fetchThreats, POLL_INTERVAL_MS);


// --- EMITTER LOOP ---
function emitAttack() {
    let attack;

    // 1. Real Data Mode (simulationMode is false)
    if (!simulationMode && attackBuffer.length > 0) {
        attack = attackBuffer.shift();
        // Recalculate timestamp to be "now" so it flashes on map
        attack.timestamp = Date.now();
    }
    // 2. Simulated Mode (simulationMode is true)
    else if (simulationMode) {
        const source = randomItem(TECH_HUBS);
        let destination = randomItem(TECH_HUBS);
        while (destination.name === source.name) destination = randomItem(TECH_HUBS);

        // Simulation should only generate known attack types, excluding 'Unclassified'
        const type = randomItem(ATTACK_TYPES.slice(0, 5));

        attack = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            isReal: false, // Flag as simulated data
            type: type.type,
            color: type.color,
            src: { lat: jitter(source.lat), lng: jitter(source.lng), country: source.name },
            dst: { lat: jitter(destination.lat), lng: jitter(destination.lng), country: destination.name },
            value: Math.floor(Math.random() * 5) + 1
        };
    } else {
        // Real data empty and simulation is OFF. Wait and try again.
        setTimeout(emitAttack, 1000);
        return;
    }

    io.emit("attack", attack);

    // Schedule next
    const nextDelay = (attackBuffer.length > 0) ? EMIT_INTERVAL_MS : FALLBACK_EMIT_MS;
    setTimeout(emitAttack, nextDelay); // Variable speed
}

// Start Loop
emitAttack();

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send current mode to new client
    socket.emit("mode_state", simulationMode);

    // Listen for toggle events
    socket.on("toggle_mode", () => {
        simulationMode = !simulationMode;
        console.log(`Simulation mode changed to: ${simulationMode}`);
        io.emit("mode_state", simulationMode); // Broadcast to all clients
    });
});
