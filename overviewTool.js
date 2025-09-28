/*
 * Script Name: Off/Adel/Ziel Übersicht (robust)
 * Version: 1.1
 * Author: Marvin & ChatGPT
 *
 * Hinweise:
 * - Lade diese Datei mit bookmarklet:
 *   javascript:$.getScript('https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main/overviewTool.js');
 * - Falls die twSDK-UI nicht verfügbar ist, zeigt das Script eine einfache Fallback-Box.
 */

(function () {
    const DEBUG = true; // auf false setzen wenn alles läuft
    if (DEBUG) console.log("OffAdelTool: loader start");

    let sbPlans = [];
    let villageMap = new Map();

    // ---------- Hilfsfunktionen ----------
    function convertWBPlanToArray(plan) {
        if (!plan || !plan.trim()) return [];
        let planArray = plan.split("\n").filter(str => str.trim() !== "");
        let planObjects = [];

        for (let i = 0; i < planArray.length; i++) {
            try {
                let planParts = planArray[i].split("&");
                // Sicherstellen, dass Index 7 (units) existiert
                let unitsPart = planParts[7] || "";
                let units = unitsPart.split("/").reduce((obj, str) => {
                    if (!str) return obj;
                    const [unit, value] = str.split("=");
                    if (unit === undefined || value === undefined) return obj;
                    try {
                        obj[unit] = parseInt(atob(value));
                    } catch (e) {
                        obj[unit] = parseInt(value) || 0;
                    }
                    return obj;
                }, {});

                planObjects.push({
                    commandId: i.toString(),
                    originVillageId: parseInt(planParts[0]) || 0,
                    targetVillageId: parseInt(planParts[1]) || 0,
                    slowestUnit: planParts[2] || '',
                    arrivalTimestamp: parseInt(planParts[3]) || 0,
                    type: parseInt(planParts[4]) || 0,
                    drawIn: (planParts[5] === "true"),
                    sent: (planParts[6] === "true"),
                    units: units
                });
            } catch (err) {
                if (DEBUG) console.warn("convertWBPlanToArray: failed parsing line", i, err);
            }
        }
        return planObjects;
    }

    function buildRowHTML(originText, adelText, targetText) {
        return `<tr>
            <td class="ra-tac">${originText}</td>
            <td class="ra-tac">${adelText}</td>
            <td class="ra-tac">${targetText}</td>
        </tr>`;
    }

    // ---------- UI mit twSDK (wenn vorhanden) ----------
    async function renderWithTwSDK() {
        if (DEBUG) console.log("OffAdelTool: trying twSDK UI");
        const content = `
            <fieldset>
                <legend>Plan Import</legend>
                <textarea id="importInput" style="width:100%;height:80px;"></textarea><br>
                <button id="importPlan" class="btn">Importieren</button>
                <button id="closeOverview" class="btn">Schließen</button>
            </fieldset>
            <fieldset>
                <legend>Übersicht</legend>
                <table class="ra-table" width="100%">
                    <thead>
                        <tr>
                            <th>OFF Herkunft (mit Ramme)</th>
                            <th>Adel Herkunft</th>
                            <th>Zielkoordinaten</th>
                        </tr>
                    </thead>
                    <tbody id="overviewBody"></tbody>
                </table>
            </fieldset>
        `;

        try {
            twSDK.renderBoxWidget(content, 'sbOverview', 'sb-overview');

            // Eventhandler
            $('#importPlan').off('click').on('click', function () {
                const importContent = $('#importInput').val();
                sbPlans = convertWBPlanToArray(importContent);
                renderOverviewWithMap();
            });

            $('#closeOverview').off('click').on('click', function () {
                $('#sbOverview').remove();
            });

            if (DEBUG) console.log("OffAdelTool: twSDK UI rendered");
        } catch (err) {
            if (DEBUG) console.error("OffAdelTool: error renderWithTwSDK", err);
            throw err;
        }
    }

    function renderOverviewWithMap() {
        if (!sbPlans || sbPlans.length === 0) {
            $('#overviewBody').html('<tr><td colspan="3">Keine Befehle importiert.</td></tr>');
            return;
        }
        let body = '';
        for (let row of sbPlans) {
            let originEntry = villageMap.get(parseInt(row.originVillageId));
            let targetEntry = villageMap.get(parseInt(row.targetVillageId));
            let origin = originEntry ? `${originEntry[2]}|${originEntry[3]}` : `ID:${row.originVillageId}`;
            let target = targetEntry ? `${targetEntry[2]}|${targetEntry[3]}` : `ID:${row.targetVillageId}`;

            let offCol = (row.units && row.units['ram'] && row.units['ram'] > 0) ? origin : '';
            let adelCol = (row.units && row.units['snob'] && row.units['snob'] > 0) ? origin : '';
            let zielCol = target;

            body += buildRowHTML(offCol, adelCol, zielCol);
        }
        $('#overviewBody').html(body);
        if (DEBUG) console.log("OffAdelTool: Übersicht aktualisiert, rows:", sbPlans.length);
    }

    // ---------- Einfaches Fallback-UI (wenn twSDK nicht geht) ----------
    function showFallbackUI() {
        if (DEBUG) console.log("OffAdelTool: showing fallback UI");
        // bereits vorhanden entfernen
        const existing = document.getElementById('offAdelFallback');
        if (existing) existing.remove();

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
                Hinweis: Für korrekte Koordinaten muss das Script auf der Stämme-Seite twSDK-daten lesen können. Fallback zeigt IDs, wenn keine Welt-Daten verfügbar sind.
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
        if (!sbPlans || sbPlans.length === 0) {
            bodyEl.innerHTML = '<tr><td colspan="3" style="padding:6px">Keine Befehle</td></tr>';
            return;
        }
        let html = '';
        for (let row of sbPlans) {
            // Fallback: keine villageMap -> zeigen wir IDs als Platzhalter
            let origin = villageMap.has(parseInt(row.originVillageId)) ? `${villageMap.get(parseInt(row.originVillageId))[2]}|${villageMap.get(parseInt(row.originVillageId))[3]}` : `ID:${row.originVillageId}`;
            let target = villageMap.has(parseInt(row.targetVillageId)) ? `${villageMap.get(parseInt(row.targetVillageId))[2]}|${villageMap.get(parseInt(row.targetVillageId))[3]}` : `ID:${row.targetVillageId}`;

            let offCol = (row.units && row.units['ram'] && row.units['ram'] > 0) ? origin : '';
            let adelCol = (row.units && row.units['snob'] && row.units['snob'] > 0) ? origin : '';
            html += `<tr><td style="border:1px solid #ddd;padding:6px">${offCol}</td><td style="border:1px solid #ddd;padding:6px">${adelCol}</td><td style="border:1px solid #ddd;padding:6px">${target}</td></tr>`;
        }
        bodyEl.innerHTML = html;
    }

    // ---------- Start / Initialisierung ----------
    (async function start() {
        try {
            if (!window.jQuery) {
                console.error("OffAdelTool: jQuery fehlt. Die Stämme Seite sollte jQuery laden.");
                showFallbackUI();
                return;
            }

            // Lade twSDK nur falls noch nicht vorhanden
            if (!window.twSDK) {
                if (DEBUG) console.log("OffAdelTool: twSDK nicht vorhanden -> lade twSDK");
                await new Promise((resolve, reject) => {
                    $.getScript('https://cdn.jsdelivr.net/gh/SaveBankDev/Tribal-Wars-Scripts-SDK@main/twSDK.js')
                        .done(() => { if (DEBUG) console.log("OffAdelTool: twSDK geladen"); resolve(); })
                        .fail((err) => { if (DEBUG) console.warn("OffAdelTool: twSDK laden fehlgeschlagen", err); reject(err); });
                }).catch(() => { /* weiter zu Fallback */ });
            } else {
                if (DEBUG) console.log("OffAdelTool: twSDK bereits vorhanden");
            }

            if (window.twSDK && typeof twSDK.init === 'function') {
                // Init (ohne harte screen-Restrictions)
                const scriptConfig = {
                    scriptData: { prefix: 'sbOT', name: 'Off/Adel/Ziel Übersicht', version: '1.1', author: 'Marvin & ChatGPT' },
                    allowedScreens: [], // leer = flexibel
                    allowedModes: [],
                    isDebug: DEBUG
                };
                try {
                    await twSDK.init(scriptConfig);
                    if (DEBUG) console.log("OffAdelTool: twSDK.init ok");
                } catch (e) {
                    if (DEBUG) console.warn("OffAdelTool: twSDK.init gab Warnung/Fehler (weiter versucht)", e);
                }

                // Hole Weltdaten
                try {
                    const { villages } = await twSDK.worldDataAPI('village');
                    villages.forEach(v => villageMap.set(v[0], v));
                    if (DEBUG) console.log("OffAdelTool: villages geladen:", villageMap.size);
                    // Render UI via twSDK
                    await renderWithTwSDK();
                    if (DEBUG) console.log("OffAdelTool: gestartet (twSDK UI)");
                    return;
                } catch (err) {
                    if (DEBUG) console.warn("OffAdelTool: worldDataAPI oder render failed", err);
                    // Fallback unten
                }
            }

            // Wenn wir hier sind: twSDK nicht nutzbar -> fallback UI
            showFallbackUI();
            if (DEBUG) console.log("OffAdelTool: gestartet (Fallback UI)");
        } catch (err) {
            console.error("OffAdelTool: Startfehler", err);
            showFallbackUI();
        }
    })();

})();
