/*
* Script Name: Off/Adel/Ziel Übersicht
* Version: 1.0
* Author: Marvin & ChatGPT
*/

(function () {
    if (typeof DEBUG !== 'boolean') DEBUG = false;

    let sbPlans = [];
    let villageMap = new Map();

    // --- UI RENDER ---
    function renderUI() {
        let content = `
            <fieldset>
                <legend>Plan Import</legend>
                <textarea id="importInput" style="width:100%;height:80px;"></textarea><br>
                <button id="importPlan" class="btn">Importieren</button>
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
        twSDK.renderBoxWidget(content, 'sbOverview', 'sb-overview');
    }

    // --- EVENTS ---
    function addEventHandlers() {
        $('#importPlan').click(function () {
            let importContent = $('#importInput').val();
            sbPlans = convertWBPlanToArray(importContent);
            renderOverview();
        });
    }

    // --- RENDER DER 3 SPALTEN ---
    function renderOverview() {
        let body = '';

        for (let row of sbPlans) {
            let origin = `${villageMap.get(parseInt(row.originVillageId))[2]}|${villageMap.get(parseInt(row.originVillageId))[3]}`;
            let target = `${villageMap.get(parseInt(row.targetVillageId))[2]}|${villageMap.get(parseInt(row.targetVillageId))[3]}`;

            let offCol = (row.units["ram"] && row.units["ram"] > 0) ? origin : '';
            let adelCol = (row.units["snob"] && row.units["snob"] > 0) ? origin : '';
            let zielCol = target;

            body += `
                <tr>
                    <td class="ra-tac">${offCol}</td>
                    <td class="ra-tac">${adelCol}</td>
                    <td class="ra-tac">${zielCol}</td>
                </tr>
            `;
        }

        $('#overviewBody').html(body);
    }

    // --- IMPORTFUNKTION ---
    function convertWBPlanToArray(plan) {
        let planArray = plan.split("\n").filter(str => str.trim() !== "");
        let planObjects = [];

        for (let i = 0; i < planArray.length; i++) {
            let planParts = planArray[i].split("&");
            let units = planParts[7].split("/").reduce((obj, str) => {
                if (!str) return obj;
                const [unit, value] = str.split("=");
                if (unit === undefined || value === undefined) return obj;
                obj[unit] = parseInt(atob(value));
                return obj;
            }, {});

            let planObject = {
                commandId: i.toString(),
                originVillageId: parseInt(planParts[0]),
                targetVillageId: parseInt(planParts[1]),
                slowestUnit: planParts[2],
                arrivalTimestamp: parseInt(planParts[3]),
                type: parseInt(planParts[4]),
                drawIn: planParts[5] === "true",
                sent: planParts[6] === "true",
                units: units
            };

            planObjects.push(planObject);
        }

        return planObjects;
    }


        renderUI();
        addEventHandlers();
    });
})();
