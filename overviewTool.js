/*
 * Script Name: Off/Adel/Ziel Übersicht (robust)
 * Version: 1.2
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
                    slowestUnit: parts[2] || '',
                    arrivalTimestamp: parseInt(parts[3]) || 0,
                    type: parseInt(parts[4]) || 0,
                    drawIn: parts[5] === "true",
                    sent: parts[6] === "true",
                    units: units
                };
            } catch (err) {
                if (DEBUG) console.warn("convertWBPlanToArray: failed parsing line", i, err);
                return null;
            }
        }).filter(x => x !== null);
    }

    function buildRowHTML(off, adel, ziel) {
        return `<tr>
            <td class="ra-tac">${off}</td>
            <td class="ra-tac">${adel}</td>
            <td class="ra-tac">${ziel}</td>
        </tr>`;
    }

    // ---------- UI mit twSDK (wenn vorhanden) ----------
    async function renderWithTwSDK() {
        if (!window.twSDK || typeof twSDK.renderBoxWidget !== "function") {
            if (DEBUG) console.warn("twSDK.renderBoxWidget nicht verfügbar -> fallback");
            showFallbackUI();
            return;
        }

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
            if (DEBUG) console.error("OffAdelTool: renderWithTwSDK failed", err);
            showFallbackUI();
        }
    }

    function renderOverviewWithMap() {
        const bodyEl = document.getElementById('overviewBody');
        if (!bodyEl) return;

        if (!sbPlans.length) {
            bodyEl.innerHTML = '<tr><td colspan="3">Keine Befehle importiert.</td></tr>';
            return;
        }

        let html = '';
        for (const row of sbPlans) {
            const originEntry = villageMap.get(row.originVillageId);
            const targetEntry = villageMap.get(row.targetVillageId);

            const origin = originEntry ? `${originEntry[2]}|${originEntry[3]}` : `ID:${row.originVillageId}`;
            const target = targetEntry ? `${targetEntry[2]}|${targetEntry[3]}` : `ID:${row.targetVillageId}`;

            const offCol = (row.units?.ram > 0) ? origin : '';
            const adelCol = (row.units?.snob > 0) ? origin : '';

            html += buildRowHTML(offCol, adelCol, target);
        }
        bodyEl.innerHTML = html;
        if (DEBUG) console.log("OffAdelTool: Übersicht aktualisiert");
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
            const originEntry = villageMap.get(row.originVillageId);
            const targetEntry = villageMap.get(row.targetVillageId);

            const origin = originEntry ? `${originEntry[2]}|${originEntry[3]}` : `ID:${row.originVillageId}`;
            const target = targetEntry ? `${targetEntry[2]}|${targetEntry[3]}` : `ID:${row.targetVillageId}`;

            const offCol = (row.units?.ram > 0) ? origin : '';
            const adelCol = (row.units?.snob > 0) ? origin : '';

            html += `<tr><td style="border:1px solid #ddd;padding:6px">${offCol}</td>
                     <td style="border:1px solid #ddd;padding:6px">${adelCol}</td>
                     <td style="border:1px solid #ddd;padding:6px">${target}</td></tr>`;
        }
        bodyEl.innerHTML = html;
    }

    // ---------- Start / Initialisierung ----------
    (async function start() {
        if (!window.jQuery) {
            console.error("OffAdelTool: jQuery fehlt");
            showFallbackUI();
            return;
        }

        if (!window.twSDK) {
            try {
                await $.getScript('https://cdn.jsdelivr.net/gh/SaveBankDev/Tribal-Wars-Scripts-SDK@main/twSDK.js');
                if (DEBUG) console.log("OffAdelTool: twSDK geladen");
            } catch (err) {
                if (DEBUG) console.warn("twSDK Laden fehlgeschlagen", err);
            }
        }

        if (window.twSDK && typeof twSDK.init === 'function') {
            try { await twSDK.init({scriptData:{prefix:'sbOT',name:'Off/Adel/Ziel Übersicht',version:'1.2',author:'Marvin & ChatGPT'}, allowedScreens:[], allowedModes:[], isDebug:DEBUG}); } 
            catch(e){ if(DEBUG) console.warn("twSDK.init Warnung", e); }

            try {
                const { villages } = await twSDK.worldDataAPI('village');
                villages.forEach(v => villageMap.set(v[0], v));
                if (DEBUG) console.log("OffAdelTool: villages geladen", villageMap.size);
                await renderWithTwSDK();
                return;
            } catch (err) {
                if (DEBUG) console.warn("worldDataAPI oder render fehlgeschlagen", err);
            }
        }

        // fallback
        showFallbackUI();
        if (DEBUG) console.log("OffAdelTool: gestartet (Fallback UI)");
    })();
})();
