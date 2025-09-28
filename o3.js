/*
 * Script Name: Off/Adel/Ziel Übersicht — Fallback + Copy
 * Version: 1.5
 * Author: Marvin & ChatGPT
 *
 * Läuft komplett ohne twSDK
 * Zeigt Dörfer nach Typen in 6 Spalten, Copy-Button pro Spalte
 */

(function () {
    const DEBUG = true;
    if (DEBUG) console.log("OffAdelTool: loader start (Fallback + Copy)");

    let sbPlans = [];

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
                    type: parseInt(parts[4]) || 0,  // Wichtig für Filter
                    units: units,
                    coordsOrigin: parts[2] || '', // optional: SlowestUnit/Koordinaten
                    coordsTarget: parts[3] || ''
                };
            } catch (err) {
                if (DEBUG) console.warn("convertWBPlanToArray: failed parsing line", i, err);
                return null;
            }
        }).filter(x => x !== null);
    }

    function showFallbackUI() {
        if (document.getElementById('offAdelFallback')) document.getElementById('offAdelFallback').remove();

        const container = document.createElement('div');
        container.id = 'offAdelFallback';
        container.style = `
            position: fixed;
            right: 12px;
            top: 60px;
            width: 700px;
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
                <strong>Off/Adel/Ziel Übersicht — Fallback + Copy</strong>
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
                            <th>Off Herkunft (8)</th>
                            <th>Off Ziel (8)</th>
                            <th>AG Herkunft (11)</th>
                            <th>AG Ziel (11)</th>
                            <th>Cleaner Herkunft (45)</th>
                            <th>Cleaner Ziel (45)</th>
                        </tr>
                        <tr>
                            <th><button class="copyColBtn" data-col="0">Copy</button></th>
                            <th><button class="copyColBtn" data-col="1">Copy</button></th>
                            <th><button class="copyColBtn" data-col="2">Copy</button></th>
                            <th><button class="copyColBtn" data-col="3">Copy</button></th>
                            <th><button class="copyColBtn" data-col="4">Copy</button></th>
                            <th><button class="copyColBtn" data-col="5">Copy</button></th>
                        </tr>
                    </thead>
                    <tbody id="fallbackBody"></tbody>
                </table>
            </div>
        `;
        document.body.appendChild(container);

        document.getElementById('closeOffAdel').addEventListener('click', () => container.remove());
        document.getElementById('fallbackImportBtn').addEventListener('click', () => {
            const txt = document.getElementById('fallbackImport').value;
            sbPlans = convertWBPlanToArray(txt);
            renderTable();
        });

        document.querySelectorAll('.copyColBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const colIndex = parseInt(e.target.dataset.col);
                copyColumnToClipboard(colIndex);
            });
        });
    }

    function renderTable() {
        const bodyEl = document.getElementById('fallbackBody');
        if (!bodyEl) return;
        if (!sbPlans.length) {
            bodyEl.innerHTML = '<tr><td colspan="6" style="padding:6px">Keine Befehle</td></tr>';
            return;
        }

        // 6 Spalten vorbereiten
        const cols = [[],[],[],[],[],[]];

        sbPlans.forEach(row => {
            switch(row.type){
                case 8: // Off
                    cols[0].push(row.coordsOrigin || `ID:${row.originVillageId}`);
                    cols[1].push(row.coordsTarget || `ID:${row.targetVillageId}`);
                    break;
                case 11: // AG
                    cols[2].push(row.coordsOrigin || `ID:${row.originVillageId}`);
                    cols[3].push(row.coordsTarget || `ID:${row.targetVillageId}`);
                    break;
                case 45: // Cleaner
                    cols[4].push(row.coordsOrigin || `ID:${row.originVillageId}`);
                    cols[5].push(row.coordsTarget || `ID:${row.targetVillageId}`);
                    break;
            }
        });

        // maximale Zeilenanzahl
        const maxRows = Math.max(...cols.map(c=>c.length));
        let html = '';
        for(let i=0;i<maxRows;i++){
            html += '<tr>';
            for(let j=0;j<6;j++){
                html += `<td style="border:1px solid #ddd;padding:6px">${cols[j][i] || ''}</td>`;
            }
            html += '</tr>';
        }
        bodyEl.innerHTML = html;
    }

    function copyColumnToClipboard(colIndex){
        const bodyEl = document.getElementById('fallbackBody');
        if(!bodyEl) return;
        const text = Array.from(bodyEl.rows).map(r=>r.cells[colIndex]?.innerText || '').filter(t=>t).join('\n');
        navigator.clipboard.writeText(text).then(()=>{
            if(DEBUG) console.log(`Col ${colIndex} copied to clipboard`);
            alert(`Spalte ${colIndex+1} kopiert!`);
        });
    }

    // Start
    (function start() {
        if (!window.jQuery) {
            console.error("OffAdelTool: jQuery fehlt");
            alert("OffAdelTool benötigt jQuery!");
            return;
        }
        showFallbackUI();
        if (DEBUG) console.log("OffAdelTool: gestartet (Fallback + Copy)");
    })();

})();
