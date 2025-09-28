/*
 * Script Name: Off/Adel/Ziel Übersicht — Fallback only
 * Version: 1.4
 * Author: Marvin & ChatGPT
 *
 * Hinweise:
 * - Läuft komplett ohne twSDK
 * - Zeigt Ramme/Adel farbig in der Tabelle an
 */

(function () {
    const DEBUG = true;
    if (DEBUG) console.log("OffAdelTool: loader start (Fallback only)");

    let sbPlans = [];
    let villageMap = new Map(); // bleibt leer, nur IDs werden angezeigt

    // ---------- Hilfsfunktionen ----------
    function convertWBPlanToArray(plan) {
        if (!plan || !plan.trim()) return [];
        return plan.split("\n").filter(l => l.trim() !== "").map((line, i) => {
            try {
                const parts = line.split("&");
                const unitsPart = parts[7] || "";
                const units = unitsPart.split("/").reduce((obj, str) => {
                    if (!str) return obj;
                    const [unit, value] = str.split("=");
                    if (!unit || !value) return obj;
                    try { obj[unit] = parseInt(atob(value)); } 
                    catch (e) { obj[unit] = parseInt(value) || 0; }
                    return obj;
                }, {});
                return {
                    commandId: i.toString(),
                    originVillageId: parseInt(parts[0]) || 0,
                    targetVillageId: parseInt(parts[1]) || 0,
                    units: units
                };
            } catch (err) {
                if (DEBUG) console.warn("convertWBPlanToArray: failed parsing line", i, err);
                return null;
            }
        }).filter(x => x !== null);
    }

    // ---------- Fallback UI ----------
    function showFallbackUI() {
        if (document.getElementById('offAdelFallback')) document.getElementById('offAdelFallback').remove();

        const container = document.createElement('div');
        container.id = 'offAdelFallback';
        container.style = `
            position: fixed;
            right: 12px;
            top: 60px;
            width: 520px;
            max-height: 80vh;
            overflow:auto;
            z-index: 999999;
            background: #fff;
            border: 2px solid #8a6d3b;
            padding: 8px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
            font-family: Arial, sans-serif;
            font-size: 13px;
        `;
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong>Off/Adel/Ziel Übersicht — Fallback</strong>
                <button id="closeOffAdel" class="btn">X</button>
            </div>
            <div>
                <label>Plan Import (Workbench):</label><br>
                <textarea id="fallbackImport" style="width:100%;height:80px;"></textarea><br>
                <button id="fallbackImportBtn" class="btn">Importieren</button>
            </div>
            <div style="margin-top:8px;">
                <table id="fallbackTable" style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="border:1px solid #ccc;padding:6px">OFF Herkunft (Ramme)</th>
                            <th style="border:1px solid #ccc;padding:6px">Adel Herkunft</th>
                            <th style="border:1px solid #ccc;padding:6px">Ziel</th>
                        </tr>
                    </thead>
                    <tbody id="fallbackBody"></tbody>
                </table>
            </div>
            <div style="margin-top:6px;color:#555;font-size:12px">
                Hinweis: Zeigt IDs, da keine Weltdaten vorhanden sind.
            </div>
        `;
        document.body.appendChild(container);

        document.getElementById('closeOffAdel').addEventListener('click', () => container.remove());
        document.getElementById('fallbackImportBtn').addEventListener('click', () => {
            const txt = document.getElementById('fallbackImport').value;
            sbPlans = convertWBPlanToArray(txt);
            renderFallbackOverview();
        });
    }

    function renderFallbackOverview() {
        const bodyEl = document.getElementById('fallbackBody');
        if (!bodyEl) return;

        if (!sbPlans.length) {
            bodyEl.innerHTML = '<tr><td colspan="3" style="padding:6px">Keine Befehle</td></tr>';
            return;
        }

        let html = '';
        for (const row of sbPlans) {
            const origin = `ID:${row.originVillageId}`;
            const target = `ID:${row.targetVillageId}`;

            const offCol = (row.units?.ram > 0) ? `<span style="color:red;font-weight:bold">${origin}</span>` : '';
            const adelCol = (row.units?.snob > 0) ? `<span style="color:blue;font-weight:bold">${origin}</span>` : '';

            html += `<tr>
                        <td style="border:1px solid #ddd;padding:6px">${offCol}</td>
                        <td style="border:1px solid #ddd;padding:6px">${adelCol}</td>
                        <td style="border:1px solid #ddd;padding:6px">${target}</td>
                     </tr>`;
        }
        bodyEl.innerHTML = html;
    }

    // ---------- Start ----------
    (function start() {
        if (!window.jQuery) {
            console.error("OffAdelTool: jQuery fehlt");
            alert("OffAdelTool benötigt jQuery!");
            return;
        }

        showFallbackUI();
        if (DEBUG) console.log("OffAdelTool: gestartet (Fallback only)");
    })();
})();
