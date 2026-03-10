// Gunakan UUID yang konsisten
const UUID_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UUID_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; 
const UUID_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; 

let charTX;
let receivedData = ""; // Buffer untuk menampung data yang terpotong

function log(msg) {
    const d = document.getElementById('debugLog');
    d.innerHTML += `> ${msg}<br>`;
    d.scrollTop = d.scrollHeight;
}

async function connect() {
    try {
        log("Meminta izin Bluetooth...");
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'BBC micro:bit' }],
            optionalServices: [UUID_SERVICE]
        });

        log("Menyambungkan ke GATT...");
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(UUID_SERVICE);
        
        // Karakteristik untuk MENGIRIM (Web -> Microbit)
        charTX = await service.getCharacteristic(UUID_TX);
        
        // Karakteristik untuk MENERIMA (Microbit -> Web)
        const charRX = await service.getCharacteristic(UUID_RX);

        await charRX.startNotifications();
        charRX.addEventListener('characteristicvaluechanged', (e) => {
            const chunk = new TextDecoder().decode(e.target.value);
            receivedData += chunk;

            // Jika pesan lengkap (diakhiri NewLine dari microbit)
            if (receivedData.includes("\n")) {
                const finalMsg = receivedData.trim();
                log("Diterima: " + finalMsg);
                handleIncoming(finalMsg);
                receivedData = ""; // Reset buffer
            }
        });

        document.getElementById('btnConnect').innerText = "✅ TERHUBUNG";
        document.getElementById('btnConnect').className = "btn-green";
        document.getElementById('btnAlarmOn').disabled = false;
        log("Sistem Siap!");

    } catch (err) {
        log("ERROR: " + err);
        console.error(err);
    }
}

function handleIncoming(msg) {
    // Bersihkan karakter aneh
    const cleanMsg = msg.replace(/[\r\n]/g, "");

    if (cleanMsg.startsWith("CAHAYA:")) {
        document.getElementById('valCahaya').innerText = cleanMsg.split(":")[1];
    } else if (cleanMsg.includes("DIBOBOL")) {
        document.getElementById('txtStatus').innerText = "🚨 DIBOBOL!";
        document.getElementById('txtStatus').style.color = "red";
        document.getElementById('btnAlarmOff').style.display = "block";
    } else if (cleanMsg.includes("ALARM_MATI")) {
        document.getElementById('txtStatus').innerText = "Aman 🔒";
        document.getElementById('txtStatus').style.color = "green";
        document.getElementById('btnAlarmOff').style.display = "none";
    } else if (cleanMsg.includes("DIBUKA_AMAN")) {
        document.getElementById('txtStatus').innerText = "Terbuka Aman 🔓";
        document.getElementById('txtStatus').style.color = "blue";
    }
}

async function send(msg) {
    if (!charTX) return log("Error: Belum konek!");
    try {
        const encoder = new TextEncoder();
        // Pakai writeValueWithoutResponse agar lebih cepat dan kompatibel dengan UART microbit
        await charTX.writeValueWithoutResponse(encoder.encode(msg + "\n"));
        log("Terkirim: " + msg);
    } catch (err) {
        log("Gagal kirim: " + err);
    }
          }
