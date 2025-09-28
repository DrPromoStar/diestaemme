/*
* Script Name: Plan Manager
* Version: v1.2.1
* Last Updated: 2025-04-22
* Author: SaveBank
* Author Contact: Discord: savebank 
* Approved: Yes
* Approved Date: 2024-05-02
* Mod: RedAlert
*/


// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// CONSTANTS
var sbAllIdsAPM = [
    'planSelector',
    'sendByTime',
    'sendByNumber',
    'useTemplates',
];
var planIds = [];
var sbButtonIDsAPM = [];
var sbPlans = {};

var LAST_REQUEST = 0;


var scriptConfig = {
    scriptData: {
        prefix: 'sbAPM',
        name: 'Plan Manager',
        version: 'v1.2.1',
        author: 'SaveBank',
        authorUrl: 'https://forum.tribalwars.net/index.php?members/savebank.131111/',
        helpLink: 'https://forum.tribalwars.net/index.php?threads/attack-plan-manager.292267/',
    },
    translations: {
        en_DK: {
            'Redirecting...': 'Redirecting...',
            Help: 'Help',
            'Plan Manager': 'Plan Manager',
            'There was an error!': 'There was an error!',
            'Import plan:': 'Import plan:',
            'Import': 'Import',
            'Export plan:': 'Export plan:',
            'Select plan:': 'Select plan:',
            'Export': 'Export',
            'Reset Input': 'Reset Input',
            'Save Plan': 'Save Plan',
            'Delete Plan': 'Delete Plan',
            'Type': 'Type',
            'Unit Template': 'Unit Template',
            'Loading': 'Loading',
            'Select unit template:': 'Select unit template:',
            'Manage Commands': 'Manage Commands',
            'Send by Time (min)': 'Send by Time (min)',
            'Send': 'Send',
            'Send by Number': 'Send by Number',
            'Delete selected commands': 'Delete selected commands',
            'Delete sent commands': 'Delete sent commands',
            'Delete expired commands': 'Delete expired commands',
            'Delete all commands': 'Delete all commands',
            'Load Troop Templates': 'Load Troop Templates',
            'Rename Plan': 'Rename Plan',
            'Unit Preview': 'Unit Preview',
            'Template Preview': 'Template Preview',
            'Use Troop Templates': 'Use Troop Templates',
            'Too many requests! Please wait a moment before trying again.': 'Too many requests! Please wait a moment before trying again.',
            'Delete Commands': 'Delete Commands',
            'Plan Actions': 'Plan Actions',
            'Template Settings': 'Template Settings',
            'Barbarian': 'Barbarian',
            'Exported and copied to clipboard': 'Exported and copied to clipboard',
            'Combine Plan': 'Combine Plan',
            'Please select more plans to combine': 'Please select more plans to combine',
            'Saved': 'Saved',
            'Fetching troop data...': 'Fetching troop data...',
            'Fetching troop data for a large account. This may take a while...': 'Fetching troop data for a large account. This may take a while...',
            'Troop data fetched successfully!': 'Troop data fetched successfully!',
        },
        de_DE: {
            'Redirecting...': 'Weiterleiten...',
            Help: 'Hilfe',
            'Plan Manager': 'Plan Manager',
            'There was an error!': 'Es gab einen Fehler!',
            'Import plan:': 'Plan importieren:',
            'Import': 'Importieren',
            'Export plan:': 'Plan exportieren:',
            'Select plan:': 'Plan auswählen:',
            'Export': 'Exportieren',
            'Reset Input': 'Eingaben zurücksetzen',
            'Delete Plan': 'Löschen',
            'Save Plan': 'Speichern',
            'Type': 'Typ',
            'Unit Template': 'Truppenvorlage',
            'Loading': 'Lade',
            'Select unit template:': 'Truppenvorlage auswählen:',
            'Manage Commands': 'Befehle verwalten',
            'Send by Time (min)': 'Senden nach Zeit (min)',
            'Send': 'Senden',
            'Send by Number': 'Senden nach Anzahl',
            'Delete selected commands': 'Ausgewählte löschen',
            'Delete sent commands': 'Gesendete löschen',
            'Delete expired commands': 'Abgelaufene löschen',
            'Delete all commands': 'Alle löschen',
            'Load Troop Templates': 'Truppenvorlagen laden',
            'Rename Plan': 'Umbenennen',
            'Unit Preview': 'Truppenvorschau',
            'Template Preview': 'Vorlagenvorschau',
            'Use Troop Templates': 'Truppenvorlagen verwenden',
            'Too many requests! Please wait a moment before trying again.': 'Zu viele Anfragen! Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.',
            'Delete Commands': 'Befehle löschen',
            'Plan Actions': 'Aktionen für den Plan',
            'Template Settings': 'Vorlageneinstellungen',
            'Barbarian': 'Barbaren',
            'Exported and copied to clipboard': 'Exportiert und in die Zwischenablage kopiert',
            'Combine Plan': 'Kombinieren',
            'Please select more plans to combine': 'Bitte wählen Sie mehr Pläne aus, um sie zu kombinieren',
            'Saved': 'Gespeichert',
            'Troop data fetched successfully!': 'Truppendaten erfolgreich geladen!',
            'Fetching troop data for a large account. This may take a while...': 'Truppendaten für einen großen Account werden geladen. Dies kann eine Weile dauern...',
            'Troop data fetched successfully!': 'Truppendaten wurden erfolgreich geladen!',
        }
    }
    ,
    allowedMarkets: [],
    allowedScreens: ['overview_villages'],
    allowedModes: ['combined'],
    isDebug: DEBUG,
    enableCountApi: false
};





$.getScript(`https://cdn.jsdelivr.net/gh/SaveBankDev/Tribal-Wars-Scripts-SDK@main/twSDK.js`,
    async function () {
        const startTime = performance.now();
        if (DEBUG) {
            console.debug(`Init`);
        }
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');
        const isValidMode = twSDK.checkValidLocation('mode');
        if (!isValidScreen && !isValidMode) {
            // Redirect to correct screen if necessary
            UI.InfoMessage(twSDK.tt('Redirecting...'));
            twSDK.redirectTo('overview_villages&combined');
            return;
        }

        const { worldUnitInfo, worldConfig, tribes, players, villages } = await fetchWorldConfigData();
        const villageMap = new Map();
        villages.forEach(village => {
            const key = village[0];
            villageMap.set(key, village);
        });
        const playersMap = new Map();
        players.forEach(player => {
            const key = player[0];
            playersMap.set(key, player);
        });
        const unitObject = await fetchTroopsForAllVillages();
        const endTime = performance.now();
        if (DEBUG) console.debug(`${scriptInfo}: Units: `, unitObject);
        if (DEBUG) console.debug(`${scriptInfo}: Startup time: ${(endTime - startTime).toFixed(2)} milliseconds`);
        if (DEBUG) console.debug(`${scriptInfo} worldUnitInfo: `, worldUnitInfo);
        if (DEBUG) console.debug(`${scriptInfo} worldConfig: `, worldConfig);
        if (DEBUG) console.debug(`${scriptInfo} tribes: `, tribes);
        if (DEBUG) console.debug(`${scriptInfo} players: `, players);
        if (DEBUG) console.debug(`${scriptInfo} villages: `, villages);
        if (DEBUG) console.debug(`${scriptInfo} villageMap: `, villageMap);
        if (DEBUG) console.debug(`${scriptInfo} playersMap: `, playersMap);
        // Entry point
        (async function () {
            try {
                const startTime = performance.now();
                await getTroopTemplates();
                openDatabase();
                renderUI();
                addEventHandlers();
                initializeInputFields();
                count();
                const endTime = performance.now();
                if (DEBUG) console.debug(`${scriptInfo}: Time to initialize: ${(endTime - startTime).toFixed(2)} milliseconds`);
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo}: Error:`, error);
            }
        })();

        function renderUI() {
            const style = generateCSS();
            const importContent = generateImport();
            const exportContent = generateExport();
            const planSelectorContent = generatePlanSelector();
            const unitSelectorContent = generateUnitSelector();

            let content = `
                <div class="ra-mb10 sb-grid sb-grid-2">
                    <fieldset id="import" class="ra-mb10">
                        ${importContent}
                    </fieldset>
                    <fieldset id="export"  class="ra-mb10">
                        ${exportContent}
                    </fieldset>
                </div> 
                <div>
                    <fieldset class="ra-mb10 sb-grid sb-grid-20-60-40-20">
                        <div>
                            ${planSelectorContent}
                        </div>
                        <fieldset class="ra-mb10 sb-grid sb-grid-4">
                            <legend>${twSDK.tt('Plan Actions')}</legend>
                            <div>
                                <button id="savePlan" class="btn ">${twSDK.tt('Save Plan')}</button>
                            </div>
                            <div>
                                <button id="renamePlan" class="btn ">${twSDK.tt('Rename Plan')}</button>
                            </div>
                            <div>
                                <button id="deletePlan" class="btn ">${twSDK.tt('Delete Plan')}</button>
                            </div>
                            <div>
                                <button id="combinePlan" class="btn ">${twSDK.tt('Combine Plan')}</button>
                            </div>
                        </fieldset>
                        <fieldset class="ra-mb10 sb-grid sb-grid-2">
                            <legend>${twSDK.tt('Template Settings')}</legend>
                            <div>
                                <label for="useTemplates">${twSDK.tt('Use Troop Templates')}</label>
                                <input type="checkbox" id="useTemplates" name="useTemplates">
                            </div>
                            <div>
                                <button id="buttonLoadTemplates" class="btn ">${twSDK.tt('Load Troop Templates')}</button>
                            </div>
                        </fieldset>
                        <div class="ra-tac">
                            <button id="resetInput" class="btn " >${twSDK.tt('Reset Input')}</button>
                        </div>
                    </fieldset>
                </div>
                <div id="templateDiv" style="display: none;">
                    <fieldset class="ra-mb10">
                        ${unitSelectorContent}
                    </fieldset>
                </div>
                <div id="manageCommandsDiv" style="display: none;">
                    <fieldset class="ra-mb10 sb-grid sb-grid-17-17-67">
                        <legend>${twSDK.tt('Manage Commands')}</legend>
                        <div>
                            <label for="sendByTime">${twSDK.tt('Send by Time (min)')}</label>
                            <input type="number" id="sendByTime">
                            <button id="buttonByTime" class="btn">${twSDK.tt('Send')}</button>
                        </div>
                        <div>
                            <label for="sendByNumber">${twSDK.tt('Send by Number')}</label>
                            <input type="number" id="sendByNumber">
                            <button id="buttonByNumber" class="btn">${twSDK.tt('Send')}</button>
                        </div>
                        <fieldset class="ra-mb10 sb-grid sb-grid-4">
                            <legend>${twSDK.tt('Delete Commands')}</legend>
                            <div>
                                <button id="buttonDeleteSelected" class="btn ">${twSDK.tt('Delete selected commands')}</button>
                            </div>
                            <div>
                                <button id="buttonDeleteSent" class="btn ">${twSDK.tt('Delete sent commands')}</button>
                            </div>
                            <div>
                                <button id="buttonDeleteExpired" class="btn ">${twSDK.tt('Delete expired commands')}</button>
                            </div>
                            <div>
                                <button id="buttonDeleteAll" class="btn ">${twSDK.tt('Delete all commands')}</button>
                            </div>
                        </fieldset>
                    </fieldset>
                </div>
                <div id="sbPlansDiv" class="ra-mb10">
                </div>
            `
            twSDK.renderBoxWidget(
                content,
                'sbPlanManager',
                'sb-plan-manager',
                style
            );

        }

        function addEventHandlers() {
            $('#importPlan').click(function () {
                var importContent = $('#importInput').val();
                importPlan(importContent);
            });
            $('#exportPlan').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let exportContent = sbPlans[parseInt(planId.substring(planId.lastIndexOf('-') + 1))];
                let content = exportWorkbench(exportContent);
                $('#exportInput').val(content);
                twSDK.copyToClipboard(content);
                UI.InfoMessage(twSDK.tt('Exported and copied to clipboard'));
            });
            $('#resetInput').click(function () {
                resetInput();
            });
            $('#savePlan').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (DEBUG) {
                    console.debug(`${scriptInfo} Saving plan with ID: ${actualPlanId}`);
                    console.debug(`${scriptInfo} Details of the plan being saved: `, sbPlans[actualPlanId]);
                }
                modifyPlan(parseInt(actualPlanId), sbPlans[actualPlanId]);
                UI.InfoMessage(twSDK.tt('Saved'));
            });
            $('#deletePlan').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (DEBUG) console.debug(`${scriptInfo} Deleting plan with ID: ${actualPlanId}`);

                deletePlan(actualPlanId);
                if (actualPlanId in sbPlans) {
                    if (DEBUG) {
                        console.debug(`${scriptInfo} Plan with ID: ${actualPlanId} exists in sbPlans`);
                        console.debug(`${scriptInfo} Current state of sbPlans: `, sbPlans);
                    }
                    delete sbPlans[actualPlanId];
                    let index = planIds.indexOf(planId);
                    if (index !== -1) {
                        planIds.splice(index, 1);
                    }
                }
                localStorageSettings.planSelector = '---';
                $(`#${planId}`).hide();
                saveLocalStorage(localStorageSettings);
                populatePlanSelector();
            });
            $('#renamePlan').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let planNames = localStorageSettings.planNames;
                let newPlanName = planId;
                if (planNames[planId]) {
                    let savedPlanName = planNames[planId];
                    newPlanName = prompt("Please enter the new name for the plan", savedPlanName);
                    if (DEBUG) console.debug(`${scriptInfo} Renaming plan with ID: ${planId} from ${savedPlanName} to ${newPlanName}`);
                } else {
                    newPlanName = prompt("Please enter the new name for the plan", planId);
                    if (DEBUG) console.debug(`${scriptInfo} Naming new plan with ID: ${planId} as ${newPlanName}`);
                }

                planNames[planId] = newPlanName;
                localStorageSettings.planNames = planNames;
                saveLocalStorage(localStorageSettings);
                populatePlanSelector();
            });
            $('#combinePlan').click(function () {
                if ($('#sbPlanSelectorPopup').length > 0) {
                    $('#sbPlanSelectorPopup').remove();
                }
                const style = generateCSS();
                const localStorageSettings = getLocalStorage();
                const planNames = localStorageSettings.planNames;
                let body = '<div class="ra-table-container"><table class="ra-mb10 ra-table" width="100%">';
                for (let i = 0; i < planIds.length; i++) {
                    let optionValue = planIds[i];
                    let optionText = planNames && planNames[planIds[i]] ? planNames[planIds[i]] : planIds[i];
                    body += `<tr width="100%"><td><input type="checkbox" id="${optionValue}" class="plan-checkbox"></td><td><label for="${optionValue}" style="font-weight: bold;">${optionText}</label></td></tr>`;
                }
                body += '</table></div>';
                body += '<button id="combineButton" class="btn ra-mb10">Combine</button>';

                twSDK.renderFixedWidget(
                    body,
                    'sbPlanSelectorPopup',
                    'sbPlanSelectorPopupClass',
                    style,
                );

                $('#combineButton').click(function () {
                    const localStorageSettings = getLocalStorage();
                    let selectedPlanIds = $('.plan-checkbox:checked').map(function () {
                        return this.id;
                    }).get();

                    if (selectedPlanIds.length < 1) {
                        UI.ErrorMessage('Please select more plans to combine');
                        return;
                    }

                    if (DEBUG) console.debug(`${scriptInfo} Selected plan IDs: ${selectedPlanIds.join(', ')}`);

                    let targetPlanId = selectedPlanIds.includes(localStorageSettings.planSelector) ? localStorageSettings.planSelector : selectedPlanIds[0];

                    if (DEBUG) console.debug(`${scriptInfo} Target plan ID: ${targetPlanId}`);

                    let actualTargetPlanId = parseInt(targetPlanId.substring(targetPlanId.lastIndexOf('-') + 1));

                    // Combine the plans into the target plan
                    selectedPlanIds.forEach(planId => {
                        if (planId !== targetPlanId) {
                            let actualPlanIdToCombine = parseInt(planId.substring(planId.lastIndexOf('-') + 1));

                            // Combine the commands into the target plan
                            sbPlans[actualTargetPlanId] = sbPlans[actualTargetPlanId].concat(sbPlans[actualPlanIdToCombine]);
                            deletePlan(actualPlanIdToCombine);
                            delete sbPlans[actualPlanIdToCombine];

                            // Remove the plan ID from the planIds array
                            let index = planIds.indexOf(planId);
                            if (index !== -1) planIds.splice(index, 1);

                            if (DEBUG) console.debug(`${scriptInfo} Combined plan ${planId} into ${targetPlanId}`);
                        }
                    });

                    // Redo the command IDs
                    sbPlans[actualTargetPlanId].forEach((command, index) => {
                        command.commandId = index + 1;
                    });

                    modifyPlan(actualTargetPlanId, sbPlans[actualTargetPlanId]);
                    if ($('#sbPlanSelectorPopup').length > 0) {
                        $('#sbPlanSelectorPopup').remove();
                    }
                    renderUI();
                    addEventHandlers();
                    initializeInputFields();
                    updateCommandCount();
                });
            });
            $('#buttonDeleteAll').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (DEBUG) console.debug(`${scriptInfo} Deleting all commands for plan with ID: ${actualPlanId}`);

                // Remove all corresponding rows from the table
                for (let command of sbPlans[actualPlanId]) {
                    $(`#${command.trCommandId}`).remove();
                    if (DEBUG) console.debug(`${scriptInfo} Removed command with ID: ${command.trCommandId} from the table`);
                }

                // Clear all commands for the plan
                sbPlans[actualPlanId] = [];
                modifyPlan(parseInt(actualPlanId), sbPlans[actualPlanId]);
                updateCommandCount();
            });

            $('#buttonDeleteExpired').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (DEBUG) console.debug(`${scriptInfo} Deleting expired commands for plan with ID: ${actualPlanId}`);

                let now = Date.now();

                let rowsToRemove = [];
                sbPlans[actualPlanId] = sbPlans[actualPlanId].filter(command => {
                    if (command.sendTimestamp > now) return true;
                    rowsToRemove.push(command.trCommandId);
                    return false;
                });

                for (let rowId of rowsToRemove) {
                    $(`#${rowId}`).remove();
                    if (DEBUG) console.debug(`${scriptInfo} Removed command with ID: ${rowId} from the table`);
                }

                modifyPlan(parseInt(actualPlanId), sbPlans[actualPlanId]);
                updateCommandCount();
            });

            $('#buttonDeleteSent').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (DEBUG) console.debug(`${scriptInfo} Deleting sent commands for plan with ID: ${actualPlanId}`);

                let rowsToDelete = [];

                sbPlans[actualPlanId] = sbPlans[actualPlanId].filter(command => {
                    if (command.sent === false) return true;
                    rowsToDelete.push(command.trCommandId);
                    return false;
                });

                for (let rowId of rowsToDelete) {
                    $(`#${rowId}`).remove();
                    if (DEBUG) console.debug(`${scriptInfo} Removed command with ID: ${rowId} from the table`);
                }

                modifyPlan(parseInt(actualPlanId), sbPlans[actualPlanId]);
                updateCommandCount();
            });

            $('#buttonDeleteSelected').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));

                let rowsToDelete = [];
                let commandsToDelete = [];

                for (let command of sbPlans[actualPlanId]) {
                    if (command.checkboxId && $(`#${command.checkboxId}`).is(':checked')) {
                        if (DEBUG) console.debug(`${scriptInfo} Checkbox with ID: ${command.checkboxId} is checked for deletion`);

                        rowsToDelete.push($(`#${command.trCommandId}`));
                        commandsToDelete.push(command);
                    }
                }

                for (let row of rowsToDelete) {
                    row.remove();
                    if (DEBUG) console.debug(`${scriptInfo} Removed row with ID: ${row.attr('id')} from the table`);
                }

                sbPlans[actualPlanId] = sbPlans[actualPlanId].filter(command => !commandsToDelete.includes(command));
                if (DEBUG) console.debug(`${scriptInfo} Updated plan with ID: ${actualPlanId} after deleting selected commands`);

                modifyPlan(parseInt(actualPlanId), sbPlans[actualPlanId]);
                updateCommandCount();
            });
            $('#buttonByNumber').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let number = localStorageSettings.sendByNumber;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                let plan = sbPlans[actualPlanId];
                if (DEBUG) console.debug(`${scriptInfo} Sorting commands for plan with ID: ${actualPlanId} by number: ${number}`);
                plan.sort((a, b) => {
                    let distanceA = getDistanceFromIDs(parseInt(a.originVillageId), parseInt(a.targetVillageId));
                    let unitSpeedA = parseInt(worldUnitInfo.config[a.slowestUnit].speed);
                    let sendTimestampA = parseInt(parseInt(a.arrivalTimestamp) - (twSDK.getTravelTimeInSecond(distanceA, unitSpeedA) * 1000));
                    let remainingTimestampA = parseInt(sendTimestampA - Date.now());

                    let distanceB = getDistanceFromIDs(parseInt(b.originVillageId), parseInt(b.targetVillageId));
                    let unitSpeedB = parseInt(worldUnitInfo.config[b.slowestUnit].speed);
                    let sendTimestampB = parseInt(parseInt(b.arrivalTimestamp) - (twSDK.getTravelTimeInSecond(distanceB, unitSpeedB) * 1000));
                    let remainingTimestampB = parseInt(sendTimestampB - Date.now());

                    return remainingTimestampA - remainingTimestampB;
                });
                let commandsToSend = [];
                for (let command of plan) {
                    commandsToSend.push(generateLink(parseInt(command.originVillageId), parseInt(command.targetVillageId), command.units, command.trCommandId, command.type));
                    command.sent = true;
                    $('#' + command.buttonSendId + ' button').addClass('btn-confirm-yes');
                    if (commandsToSend.length >= number) break;
                }
                modifyPlan(parseInt(actualPlanId), plan);
                if (DEBUG) console.debug(`${scriptInfo} Generated ${commandsToSend.length} commands to send`);
                let delay = 200;
                for (let link of commandsToSend) {
                    setTimeout(() => {
                        window.open(link, '_blank');
                    }, delay);
                    delay += 200;
                }
                updateCommandCount();
            });
            $('#buttonByTime').click(function () {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let time = parseInt(localStorageSettings.sendByTime) * 60000;
                let lastDashIndex = planId.lastIndexOf('-');
                let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                let plan = sbPlans[actualPlanId];

                let timeNow = Date.now();
                let commandsToSend = [];

                for (let command of plan) {
                    let sendTimestamp = parseInt(command.sendTimestamp);
                    let remainingTimestamp = parseInt(sendTimestamp - timeNow);
                    if (remainingTimestamp > time) continue;
                    commandsToSend.push(generateLink(parseInt(command.originVillageId), parseInt(command.targetVillageId), command.units, command.trCommandId, command.type));
                    command.sent = true;
                    $('#' + command.buttonSendId + ' button').addClass('btn-confirm-yes');
                }
                if (DEBUG) console.debug(`${scriptInfo} Generated ${commandsToSend.length} commands to send`);
                modifyPlan(parseInt(actualPlanId), plan);
                let delay = 0;
                for (let link of commandsToSend) {
                    setTimeout(() => {
                        window.open(link, '_blank');
                    }, delay);
                    delay += 200;
                }
                updateCommandCount();
            });
            $('#buttonLoadTemplates').click(async function () {
                if (DEBUG) console.debug(`${scriptInfo} Loading troop templates`);
                await getTroopTemplates();
                if (DEBUG) console.debug(`${scriptInfo} Troop templates loaded`);
            });

            $(document).ready(function () {
                var sbStandardButtonIds = [
                    "savePlan",
                    "renamePlan",
                    "deletePlan",
                    "combinePlan",
                    "buttonLoadTemplates",
                    "resetInput",
                    "buttonByTime",
                    "buttonByNumber",
                    "buttonDeleteSelected",
                    "buttonDeleteSent",
                    "buttonDeleteExpired",
                    "buttonDeleteAll"
                ];

                $.each(sbStandardButtonIds, function (index, id) {
                    $('#' + id).keydown(function (event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                        }
                    });
                });

                if (DEBUG) console.debug(`${scriptInfo} Document is ready, attaching change handlers to IDs`);
                $.each(sbAllIdsAPM, function (index, id) {
                    $('#' + id).on('change', handleInputChange);
                    if (DEBUG) console.debug(`${scriptInfo} Attached change handler to ID: ${id}`);
                });
            });
        }

        function initializeInputFields() {
            planIds = [];
            sbButtonIDsAPM = [];
            sbPlans = {};
            getAllPlans().then(plans => {
                if (DEBUG) console.debug(`${scriptInfo} Retrieved ${plans.length} plans`);
                if (plans.length > 0) {
                    for (let i = 0; i < plans.length; i++) {
                        sbPlans[plans[i].key] = plans[i].plan;
                        $('#sbPlansDiv').append(`<div id="plan-id-${plans[i].key}" class="ra-mb10">${renderPlan(plans[i].plan, plans[i].key)}</div>`);
                        planIds.push(`plan-id-${parseInt(plans[i].key)}`);
                        $('#plan-id-' + plans[i].key).hide();
                        if (DEBUG) console.debug(`${scriptInfo} Processed plan with key: ${plans[i].key}`);
                    }
                }
                populatePlanSelector();
                createButtons();
                fillTemplateTable();
                let localStorageSettings = getLocalStorage();
                let sendByTime = localStorageSettings.sendByTime;
                let sendByNumber = localStorageSettings.sendByNumber;
                let planSelector = localStorageSettings.planSelector;
                let useTemplates = parseBool(localStorageSettings.useTemplates);
                if (useTemplates) $('#useTemplates').prop('checked', true);
                if (sendByTime) $('#sendByTime').val(sendByTime);
                if (sendByNumber) $('#sendByNumber').val(sendByNumber);
                if (planSelector === '---') $('#manageCommandsDiv').hide();
                else $('#manageCommandsDiv').show();
                Timing.tickHandlers.timers.init();
                if (DEBUG) console.debug(`${scriptInfo} Initialized input fields`);
                updateCommandCount();
            }).catch(error => {
                console.error("Error retrieving plans", error);
            });
        }

        function generateCSS() {

            let css = `
                    .sb-grid-7 {
                        grid-template-columns: repeat(7, 1fr);
                    }
                    .sb-grid-6 {
                        grid-template-columns: repeat(6, 1fr);
                    }
                    .sb-grid-5 {
                        grid-template-columns: repeat(5, 1fr);
                    }
                    .sb-grid-4 {
                        grid-template-columns: repeat(4, 1fr);
                    }
                    .sb-grid-3 {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .sb-grid-2 {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .sb-grid-20-80 {
                        grid-template-columns: 20% 80%;
                    }
                    .sb-grid-20-60-40-20 {
                        grid-template-columns: calc(15% - 10px) calc(43% - 30px) calc(30% - 20px) calc(12% - 10px);
                    }
                    .sb-grid-17-17-67 {
                        grid-template-columns: calc(17% - 20px) calc(17% - 20px) calc(66% - 40px);
                    }
                    .sb-grid-25-25-50 {
                        grid-template-columns: calc(25% - 5px) calc(25% - 5px) calc(50% - 10px);
                    }
                    .sb-grid {
                        display: grid;
                        grid-gap: 10px;
                    }
                    .sb-grid {
                        display: grid;
                        grid-gap: 10px;
                    }
                    fieldset {
                        border: 1px solid #c1a264;
                        border-radius: 4px;
                        padding: 9px;
                    }
                    legend {
                        font-size: 12px; 
                        font-weight: bold; 
                    }
                    input[type="number"] {
                        padding: 8px;
                        font-size: 14px;
                        border: 1px solid #c1a264;
                        border-radius: 3px;
                        width: 90px;
                    }
                    input[type="checkbox"] {
                        margin-right: 5px;
                        transform: scale(1.2);
                    }
                    input[type="email"] {
                        padding: 8px;
                        font-size: 11px;
                        border: 1px solid #c1a264;
                        border-radius: 3px;
                        width: 100%; 
                    }
                    input[type="email"]::placeholder { 
                        font-style: italic;
                        font-size: 10px;
                    }
                    input[type="number"]::-webkit-inner-spin-button,
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"] {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type="number"] {
                        -moz-appearance: textfield;
                    }
                    input[type="number"]:focus,
                    input[type="checkbox"]:focus,
                    input[type="email"]:focus {
                        outline: none;
                        border-color: #92794e;
                        box-shadow: 0 0 5px rgba(193, 162, 100, 0.7);
                    }
                    select {
                        padding: 8px;
                        font-size: 14px;
                        border: 1px solid #c1a264;
                        border-radius: 3px;
                        width: 165px;
                    }
                    select:hover {
                        border-color: #92794e; 
                    }
                    
                    select:focus {
                        outline: none;
                        border-color: #92794e; 
                        box-shadow: 0 0 5px rgba(193, 162, 100, 0.7);
                    }

                    .buttonClicked {
                        background-color: grey;
                    }
                    #resetInput {
                        padding: 8px;
                        font-size: 12px;
                        color: white;
                        font-weight: bold;
                        background: #af281d;
                        background: linear-gradient(to bottom, #af281d 0%,#801006 100%);
                        border: 1px solid;
                        border-color: #006712;
                        border-radius: 3px;
                        cursor: pointer;
                    }

                    #resetInput:hover {
                        background: #c92722;
                        background: linear-gradient(to bottom, #c92722 0%,#a00d08 100%);
                    }
                    .sbPlan tr {
                        white-space: nowrap;
                    }
                    .btn-bottom {
                        vertical-align: bottom;
                    }
                    #templateTable {
                        width: 100%;
                    }
                    #templateTable td{
                        height: 100%;
                    }

                    #templateTable td {
                        flex: 1;
                    }

                    .templateContainer {
                        display: flex;
                        flex-direction: row;
                        justify-content: space-between;
                    }

                    .templateContainer div {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        flex: 1;
                        border-left: 1px solid #ccc;
                        padding-left: 10px;
                    }

                    .templateContainer div:first-child {
                        border-left: none;
                    }
                    #sbPlanManager {
                        min-width: 1200px;
                    }
                    .sbPlan {
                        width: 100%;
                    }
            `;

            return css;
        }
        function renderPlan(plan, id) {
            if (DEBUG) console.debug(`${scriptInfo} Rendering plan with ID: ${id}`);
            tbodyContent = renderPlanRows(plan, id);
            commandCount = updateCommandCount(id);

            let html = `
        <table class="sbPlan ra-table">
            <thead>
                <tr id="planTableHeader">
                    <th id="count${id}">${commandCount}</th>
                    <th class="ra-tac">Origin Village</th>
                    <th class="ra-tac">Attacker</th>
                    <th class="ra-tac">Target Village</th>
                    <th class="ra-tac">Defender</th>
                    <th class="ra-tac">Unit</th>
                    <th class="ra-tac">Type</th>
                    <th class="ra-tac">Send Time</th>
                    <th class="ra-tac">Arrival Time</th>
                    <th class="ra-tac">Remaining Time</th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            ${tbodyContent}
        </table>
    `;

            if (DEBUG) console.debug(`${scriptInfo} Rendered plan with ID: ${id}`);
            return html;
        }

        function updateCommandCount(planId) {
            let commandCount;
            let actualPlanId;
            if (planId) {
                if (!sbPlans || !sbPlans[planId]) {
                    if (DEBUG) console.warn(`${scriptInfo} Plan with ID: ${planId} does not exist`);
                    return;
                }
                commandCount = sbPlans[planId].length;
                actualPlanId = planId;
            } else {
                let localStorageSettings = getLocalStorage();
                let planId = localStorageSettings.planSelector;
                let lastDashIndex = planId.lastIndexOf('-');
                actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
                if (!sbPlans || !sbPlans[actualPlanId]) {
                    if (DEBUG) console.warn(`${scriptInfo} Plan with ID: ${actualPlanId} does not exist`);
                    return;
                }
                commandCount = sbPlans[actualPlanId].length;
                document.getElementById(`count${actualPlanId}`).textContent = commandCount;
            }
            if (DEBUG) console.debug(`${scriptInfo} Updated command count for plan with ID: ${actualPlanId}`);
            return commandCount;
        }

        function renderPlanRows(plan, id) {
            if (DEBUG) console.debug(`${scriptInfo} Rendering plan rows for plan with ID: ${id}`);
            plan.sort((a, b) => {
                let distanceA = getDistanceFromIDs(parseInt(a.originVillageId), parseInt(a.targetVillageId));
                let unitSpeedA = parseInt(worldUnitInfo.config[a.slowestUnit].speed);
                let sendTimestampA = parseInt(parseInt(a.arrivalTimestamp) - (twSDK.getTravelTimeInSecond(distanceA, unitSpeedA) * 1000));
                let remainingTimestampA = parseInt(sendTimestampA - Date.now());

                let distanceB = getDistanceFromIDs(parseInt(b.originVillageId), parseInt(b.targetVillageId));
                let unitSpeedB = parseInt(worldUnitInfo.config[b.slowestUnit].speed);
                let sendTimestampB = parseInt(parseInt(b.arrivalTimestamp) - (twSDK.getTravelTimeInSecond(distanceB, unitSpeedB) * 1000));
                let remainingTimestampB = parseInt(sendTimestampB - Date.now());

                return remainingTimestampA - remainingTimestampB;
            });

            let tbodyContent = '';
            for (let i = 0; i < plan.length; i++) {
                let row = plan[i];
                let commandId = row.commandId;
                row.commandId = parseInt(row.commandId);
                let timeStampId = `${id}-remainingTimestamp-${commandId}`;
                let buttonSendId = `${id}-buttonsend-${commandId}`;
                let buttonDeleteId = `${id}-buttondelete-${commandId}`;
                let checkboxId = `${id}-checkbox-${commandId}`;
                let trCommandId = `${id}-commandId-${commandId}`;
                sbButtonIDsAPM.push(buttonDeleteId);
                sbButtonIDsAPM.push(buttonSendId);

                let distance = getDistanceFromIDs(parseInt(row.originVillageId), parseInt(row.targetVillageId));
                let unitSpeed = parseInt(worldUnitInfo.config[row.slowestUnit].speed);
                let getTravelTimeInMS = twSDK.getTravelTimeInSecond(distance, unitSpeed) * 1000;
                let sendTimestamp = parseInt(parseInt(row.arrivalTimestamp) - getTravelTimeInMS);
                let remainingTimestamp = parseInt(sendTimestamp - Date.now());
                let commandTypeImageLink = commandTypeToImageLink(parseInt(row.type));


                let sendTime = convertTimestampToDateString(sendTimestamp);
                let arrivalTime = convertTimestampToDateString(parseInt(row.arrivalTimestamp));
                row.sendTimestamp = sendTimestamp;
                row.checkboxId = checkboxId;
                row.buttonSendId = buttonSendId;
                row.trCommandId = trCommandId;
                row.remainingTimestamp = remainingTimestamp;

                if (DEBUG) console.debug(`${scriptInfo} Processed row with command ID: ${commandId} for plan with ID: ${id}`);

                tbodyContent += `
            <tr id="${trCommandId}">
                <td class="ra-tac"><input type="checkbox" id="${checkboxId}"></td>
                <td class="ra-tac"><a href="/game.php?village=${game_data.village.id}&screen=info_village&id=${row.originVillageId}"><span class="quickedit-label">${villageMap.get(parseInt(row.originVillageId))[2]}|${villageMap.get(parseInt(row.originVillageId))[3]}</span></a></td>
                <td class="ra-tac">${villageMap.get(parseInt(row.originVillageId))[4] !== 0 ? `<a href="/game.php?village=${game_data.village.id}&screen=info_player&id=${villageMap.get(parseInt(row.originVillageId))[4]}"><span class="quickedit-label">${playersMap.get(parseInt(villageMap.get(parseInt(row.originVillageId))[4]))[1]}</span></a>` : `<span class="quickedit-label">${twSDK.tt('Barbarian')}</span>`}</td>
                <td class="ra-tac"><a href="/game.php?village=${game_data.village.id}&screen=info_village&id=${row.targetVillageId}"><span class="quickedit-label">${villageMap.get(parseInt(row.targetVillageId))[2]}|${villageMap.get(parseInt(row.targetVillageId))[3]}</span></td>
                <td class="ra-tac">${villageMap.get(parseInt(row.targetVillageId))[4] !== 0 ? `<a href="/game.php?village=${game_data.village.id}&screen=info_player&id=${villageMap.get(parseInt(row.targetVillageId))[4]}"><span class="quickedit-label">${playersMap.get(parseInt(villageMap.get(parseInt(row.targetVillageId))[4]))[1]}</span></a>` : `<span class="quickedit-label">${twSDK.tt('Barbarian')}</span>`}</td>
                <td class="ra-tac"><img src="https://dsde.innogamescdn.com/asset/9f9563bf/graphic/unit/unit_${row.slowestUnit}.webp"></td>
                <td class="ra-tac"><img src="${commandTypeImageLink}"></td>
                <td class="ra-tac">${sendTime}</td>
                <td class="ra-tac">${arrivalTime}</td>
                <td id="${timeStampId}" class="ra-tac"><span class="timer" data-endtime>${twSDK.secondsToHms(parseInt(remainingTimestamp / 1000))}</span></td>
                <td id="${buttonSendId}" class="ra-tac"></td>
                <td id="${buttonDeleteId}" class="ra-tac"></td>
            </tr>
        `;
            }
            if (DEBUG) console.debug(`${scriptInfo} Rendered plan rows for plan with ID: ${id}`);
            return tbodyContent;
        }

        function generateLink(villageId1, villageId2, unitInfo, idInfo, commandType) {
            if (DEBUG) console.debug(`${scriptInfo} Generating link for command from village ${villageId1} to village ${villageId2}`);
            let completeLink = getCurrentURL();
            completeLink += twSDK.sitterId.length > 0 ? `?${twSDK.sitterId}&village=${villageId1}&screen=place&target=${villageId2}` : `?village=${villageId1}&screen=place&target=${villageId2}`;

            let villageUnits = unitObject[villageId1];
            let [planId, _, commandId] = idInfo.split('-').map((x, i) => i === 0 ? parseInt(x) : x);
            let templateId = planId + "-templateSelector-" + commandType;
            const localStorageSettings = getLocalStorage();
            let useTemplates = parseBool(localStorageSettings.useTemplates);
            const templateName = localStorageSettings.templateSelections[templateId];

            let template = localStorageSettings.troopTemplates.find(templateObj => templateObj.name === templateName)?.units;

            let unitsToSend = {};
            if (useTemplates) {
                for (let unit of game_data.units) {
                    let templateUnit = parseInt(template[unit]);

                    if (template[unit] == "all") unitsToSend[unit] = villageUnits[unit];
                    else if (templateUnit >= 0) unitsToSend[unit] = Math.min(templateUnit, villageUnits[unit]);
                    else if (templateUnit < 0) {
                        let unitAmount = villageUnits[unit] - Math.abs(templateUnit);
                        if (unitAmount > 0) unitsToSend[unit] = unitAmount;
                    }
                }
            } else {
                for (let unit of game_data.units) {
                    let unitAmount = unitInfo[unit];
                    unitsToSend[unit] = unitAmount;
                }
            }

            for (let [unit, amount] of Object.entries(unitsToSend)) {
                completeLink += `&${unit}=${amount}`;
            }

            if (DEBUG) console.debug(`${scriptInfo} Generated link for command from village ${villageId1} to village ${villageId2}`);
            return completeLink;
        }

        function createButtons() {
            if (DEBUG) console.debug(`${scriptInfo} Creating buttons`);
            for (let i = 0; i < sbButtonIDsAPM.length; i++) {
                let buttonId = sbButtonIDsAPM[i];
                let parentElement = document.getElementById(buttonId);
                if (parentElement) parentElement.innerHTML = '';
            }
            for (let i = 0; i < sbButtonIDsAPM.length; i++) {
                let buttonId = sbButtonIDsAPM[i];
                let isSendButton = buttonId.includes('buttonsend');
                let isDeleteButton = buttonId.includes('buttondelete');

                if (isSendButton) {
                    let sendButton = document.createElement("button");
                    sendButton.innerHTML = "Send";
                    sendButton.id = buttonId + "Send";
                    sendButton.classList.add("btn");
                    sendButton.onclick = function () {
                        let [planId, _, commandId] = buttonId.split('-').map((x, i) => i !== 1 ? parseInt(x) : x);
                        let key;
                        for (key in sbPlans[planId]) {
                            if (sbPlans[planId][key].commandId === commandId) {
                                sbPlans[planId][key].sent = true;
                                break;
                            }
                        }
                        sendButton.classList.add("btn-confirm-yes");
                        let originVillageId = parseInt(sbPlans[planId][key].originVillageId);
                        let targetVillageId = parseInt(sbPlans[planId][key].targetVillageId);
                        let trCommandId = sbPlans[planId][key].trCommandId;
                        let type = sbPlans[planId][key].type;
                        let units = sbPlans[planId][key].units;
                        modifyPlan(parseInt(planId), sbPlans[planId]);
                        if (DEBUG) console.debug(`${scriptInfo} Sending command from village ${originVillageId} to village ${targetVillageId}`);
                        let sendLink = generateLink(originVillageId, targetVillageId, units, trCommandId, type);
                        window.open(sendLink, '_blank');
                    }
                    sendButton.addEventListener('keydown', function (event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                        }
                    });
                    let [planId, _, commandId] = buttonId.split('-').map((x, i) => i !== 1 ? parseInt(x) : x);
                    let key;
                    for (key in sbPlans[planId]) {
                        if (parseInt(sbPlans[planId][key].commandId) === commandId) {
                            if (parseBool(sbPlans[planId][key].sent)) {
                                sendButton.classList.add("btn-confirm-yes");
                            }
                            break;
                        }
                    }
                    let sendParent = document.getElementById(buttonId);
                    sendParent.appendChild(sendButton);
                }
                if (isDeleteButton) {
                    let deleteButton = document.createElement("button");
                    deleteButton.innerHTML = "Delete";
                    deleteButton.id = buttonId + "Delete";
                    deleteButton.classList.add("btn");
                    deleteButton.onclick = function () {
                        let [planId, _, commandId] = buttonId.split('-').map((x, i) => i !== 1 ? parseInt(x) : x);
                        let row = deleteButton.parentNode.parentNode;
                        row.parentNode.removeChild(row);
                        let plan = sbPlans[planId];
                        if (plan) {
                            let commandIndex = plan.findIndex(command => command.commandId === commandId);
                            if (commandIndex !== -1) plan.splice(commandIndex, 1);
                        }
                        modifyPlan(parseInt(planId), plan);
                        if (DEBUG) console.debug(`${scriptInfo} Deleted command with ID ${commandId} from plan ${planId}`);
                        updateCommandCount();
                    }
                    deleteButton.addEventListener('keydown', function (event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                        }
                    });
                    let deleteParent = document.getElementById(buttonId);
                    deleteParent.appendChild(deleteButton);
                }
            }
            if (DEBUG) console.debug(`${scriptInfo} Finished creating buttons`);
        }
        function parseBool(input) {
            if (typeof input === 'string') {
                return input.toLowerCase() === 'true';
            } else if (typeof input === 'boolean') {
                return input;
            } else {
                console.error(`${scriptInfo}: Invalid input: needs to be a string or boolean.`);
                return false;
            }
        }
        function commandTypeToImageLink(type) {
            const baseURL = 'https://ds-ultimate.de/images/ds_images/';
            const imageMap = {
                0: 'unit/spear.png',
                1: 'unit/sword.png',
                2: 'unit/axe.png',
                3: 'unit/archer.png',
                4: 'unit/spy.png',
                5: 'unit/light.png',
                6: 'unit/marcher.png',
                7: 'unit/heavy.png',
                8: 'unit/ram.png',
                9: 'unit/catapult.png',
                10: 'unit/knight.png',
                11: 'unit/snob.png',
                12: 'wb/def_cav.png',
                13: 'wb/def_archer.png',
                14: 'wb/fake.png',
                15: 'wb/ally.png',
                16: 'wb/move_out.png',
                17: 'wb/move_in.png',
                18: 'wb/bullet_ball_blue.png',
                19: 'wb/bullet_ball_green.png',
                20: 'wb/bullet_ball_yellow.png',
                21: 'wb/bullet_ball_red.png',
                22: 'wb/bullet_ball_grey.png',
                23: 'wb/warning.png',
                24: 'wb/die.png',
                25: 'wb/add.png',
                26: 'wb/remove.png',
                27: 'wb/checkbox.png',
                28: 'wb/eye.png',
                29: 'wb/eye_forbidden.png',
                30: 'buildings/small/main.png',
                31: 'buildings/small/barracks.png',
                32: 'buildings/small/stable.png',
                33: 'buildings/small/garage.png',
                34: 'buildings/small/church.png',
                35: 'buildings/small/snob.png',
                36: 'buildings/small/smith.png',
                37: 'buildings/small/place.png',
                38: 'buildings/small/statue.png',
                39: 'buildings/small/market.png',
                40: 'buildings/small/wood.png',
                41: 'buildings/small/stone.png',
                42: 'buildings/small/iron.png',
                43: 'buildings/small/farm.png',
                44: 'buildings/small/storage.png',
                45: 'buildings/small/wall.png',
                46: 'wb/def_fake.png',
            };

            return baseURL + (imageMap[type] || imageMap[8]);
        }

        function convertTimestampToDateString(timestamp) {
            let date = new Date(timestamp);
            let options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            return `${date.toLocaleDateString(undefined, options)}`;
        }

        function getDistanceFromIDs(originVillageId, targetVillageId) {
            let originVillage = villageMap.get(originVillageId)[2] + "|" + villageMap.get(originVillageId)[3];
            let targetVillage = villageMap.get(targetVillageId)[2] + "|" + villageMap.get(targetVillageId)[3];
            return twSDK.calculateDistance(originVillage, targetVillage);
        }


        function generateImport() {
            const html = `
                <legend>${twSDK.tt('Import plan:')}</legend>
                <textarea id="importInput" class="sb-input-textarea"></textarea>
                <div class="ra-mb10">
                    <button id="importPlan" class="btn">${twSDK.tt('Import')}</button>
                </div>
            `;
            return html;
        }

        function generateExport() {
            const html = `

                    <legend>${twSDK.tt('Export plan:')}</legend>
                    <textarea id="exportInput" class="sb-input-textarea"></textarea>
                
                <div class="ra-mb10">
                <button id="exportPlan" class="btn">${twSDK.tt('Export')}</button>
            </div>
            `;
            return html;
        }

        function generateUnitSelector() {
            const html = `
            <legend>${twSDK.tt('Select unit template:')}</legend>
            <table id="templateTable" class="ra-mb10 ra-table">
                <thead>
                    <tr>
                        <th>${twSDK.tt('Type')}</th>
                        <th>${twSDK.tt('Unit Template')}</th>
                        <th>${twSDK.tt('Template Preview')}</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            `;

            return html;
        }

        function fillTemplateTable() {
            let table = $('#templateTable');
            let templateDiv = $('#templateDiv');
            let localStorageSettings = getLocalStorage();
            let troopTemplates = localStorageSettings.troopTemplates;
            let planId = localStorageSettings.planSelector;
            let lastDashIndex = planId.lastIndexOf('-');
            let actualPlanId = parseInt(planId.substring(lastDashIndex + 1));
            let plan = sbPlans[actualPlanId];
            let commandTypes = [];

            if (DEBUG) console.debug(`${scriptInfo} Unit templates:`, troopTemplates);

            if (planId === "---") {
                templateDiv.hide();
                return;
            } else {
                templateDiv.show();
            }

            for (let command of plan) {
                if (!commandTypes.includes(command.type)) {
                    commandTypes.push(command.type);
                }
            }

            if (DEBUG) console.debug(`${scriptInfo} Command types:`, commandTypes);

            table.find('tbody').empty();

            if (commandTypes.length === 0) {
                templateDiv.hide();
                return;
            } else {
                templateDiv.show();
            }

            for (let commandType of commandTypes) {
                let row = $('<tr></tr>');
                let commandTypeImageLink = commandTypeToImageLink(commandType);
                let commandTypeCell = $('<td></td>').html(`<img src="${commandTypeImageLink}">`);
                row.append(commandTypeCell);
                let templateCell = $('<td></td>');
                let id = `${actualPlanId}-templateSelector-${commandType}`;
                let select = $('<select></select>').attr('id', id);
                for (let template of troopTemplates) {
                    let option = $('<option></option>').val(template.name).text(template.name);
                    select.append(option);
                }
                let savedOption = localStorageSettings.templateSelections[id];
                if (savedOption) {
                    select.val(savedOption);
                } else {
                    select.val(troopTemplates[0].name);
                    localStorageSettings.templateSelections[id] = troopTemplates[0].name;
                    saveLocalStorage(localStorageSettings);
                }
                select.on('change', function () {
                    let selectedOption = $(this).val();
                    let localStorageSettings = getLocalStorage();
                    localStorageSettings.templateSelections[id] = selectedOption;
                    saveLocalStorage(localStorageSettings);
                    fillTemplateTable();
                    if (DEBUG) console.debug(`${scriptInfo} Selected option:`, selectedOption);
                });
                templateCell.append(select);
                let previewCell = $('<td class="templateContainer"></td>');
                let selectedTemplate = troopTemplates.find(template => template.name === localStorageSettings.templateSelections[id]) || troopTemplates[0];
                if (selectedTemplate) {
                    for (let unit in selectedTemplate.units) {
                        if (unit === "militia") continue;
                        let unitAmount = selectedTemplate.units[unit];
                        let unitImage = $(`<img class="unitImage" src="/graphic/unit/unit_${unit}.webp" alt="${unit}"> `);
                        let unitPreview = $(`
                <div>
                    ${unitImage.prop('outerHTML')}
                    <span>${unitAmount}</span>
                </div>
            `);
                        previewCell.append(unitPreview);
                    }
                }
                row.append(templateCell);
                row.append(previewCell);
                table.find('tbody').append(row);
            }
            if (DEBUG) console.debug(`${scriptInfo} Filled template table`);
        }

        function generatePlanSelector() {
            const html = `
                    <legend>${twSDK.tt('Select plan:')}</legend>
                    <select id="planSelector" class="sb-input-select">
                        <option value="---">---</option>
                    </select>
                
            `;
            return html;
        }
        function populatePlanSelector() {
            if ($('#sbPlanSelectorPopup').length > 0) {
                $('#sbPlanSelectorPopup').remove();
            }
            let localStorageSettings = getLocalStorage();
            let planNames = localStorageSettings.planNames;
            let planSelector = document.getElementById('planSelector');
            $("#planSelector option").each(function () {
                if ($(this).val() !== '---') $(this).remove();
            });
            for (let i = 0; i < planIds.length; i++) {
                let option = document.createElement('option');
                option.value = planIds[i];
                option.text = planNames && planNames[planIds[i]] ? planNames[planIds[i]] : planIds[i];
                planSelector.appendChild(option);
                if (DEBUG) console.debug(`${scriptInfo} Added plan with ID ${planIds[i]} to the plan selector`);
            }
            for (let planid of planIds) {
                if (planid === localStorageSettings.planSelector) {
                    $(`#${planid}`).show();
                    planSelector.value = planid;
                    if (DEBUG) console.debug(`${scriptInfo} Selected plan with ID ${planid}`);
                } else {
                    $(`#${planid}`).hide();
                }
            }
        }


        function importPlan(content) {
            let plan = convertWBPlanToArray(content);
            addPlan(plan)
                .then(key => {
                    if (DEBUG) console.debug(`${scriptInfo} Plan added successfully with key: ${key}`);
                    let localStorageSettings = getLocalStorage();
                    localStorageSettings.planSelector = `plan-id-${key}`;
                    saveLocalStorage(localStorageSettings);
                    if ($('#sbPlanSelectorPopup').length > 0) {
                        $('#sbPlanSelectorPopup').remove();
                    }
                    renderUI();
                    addEventHandlers();
                    initializeInputFields();
                })
                .catch(error => {
                    if (DEBUG) console.debug(`${scriptInfo} Error adding plan: ${error}`);
                });
        }

        function convertWBPlanToArray(plan) {
            let planArray = plan.split("\n").filter(str => str.trim() !== "");
            let planObjects = [];

            for (let i = 0; i < planArray.length; i++) {
                let planParts = planArray[i].split("&");
                let units = planParts[7].split("/").reduce((obj, str) => {
                    if (!str) {
                        return obj;
                    }
                    const [unit, value] = str.split("=");
                    if (unit === undefined || value === undefined) {
                        return obj;
                    }
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
                    drawIn: parseBool(planParts[5]),
                    sent: parseBool(planParts[6]),
                    units: units
                };

                planObjects.push(planObject);
                if (DEBUG) console.debug(`${scriptInfo}: Plan object ${i} created: `, planObject);
            }

            if (DEBUG) console.debug(`${scriptInfo}: Plan objects created: `, planObjects);
            return planObjects;
        }

        // origin, target, slowest, arrival, type, drawIn=true, sent=false, units
        function exportWorkbench(planArray) {
            let exportWB = "";
            for (let row of planArray) {
                let {
                    commandId,
                    originVillageId,
                    targetVillageId,
                    slowestUnit,
                    arrivalTimestamp,
                    type,
                    drawIn,
                    sent,
                    units
                } = row;

                let arrTimestamp = (new Date(arrivalTimestamp).getTime()) + type;
                exportWB += originVillageId + "&" + targetVillageId + "&" + slowestUnit +
                    "&" + arrTimestamp + "&" + type + "&" + drawIn + "&" + sent + "&";

                let unitsArray = [];
                for (let unit in units) {
                    unitsArray.push(unit + "=" + btoa(units[unit]));
                }
                exportWB += unitsArray.join('/') + "\n";
            }

            return exportWB;
        }

        function count() {
            const apiUrl = 'https://api.counterapi.dev/v1';

            const apiKey = 'sbPlanManager'; // api key
            const namespace = 'savebankscriptstw'; // namespace
            try {
                $.getJSON(`${apiUrl}/${namespace}/${apiKey}/up`, response => {
                    if (DEBUG) console.debug(`Total script runs: ${response.count}`);
                }).fail(() => { if (DEBUG) console.debug("Failed to fetch total script runs"); });
            } catch (error) { if (DEBUG) console.debug("Error fetching total script runs: ", error); }

        }

        function openDatabase() {
            let openRequest = indexedDB.open("sbPlanManager");

            openRequest.onsuccess = function (event) {
                if (DEBUG) console.debug(`${scriptInfo} Database opened successfully`);
                let db = event.target.result;
            };

            openRequest.onerror = function (event) {
                console.error(`${scriptInfo} Error opening database`, event);
            };

            openRequest.onupgradeneeded = function (event) {
                if (DEBUG) console.debug(`${scriptInfo} Upgrading database`);
                let db = event.target.result;

                if (!db.objectStoreNames.contains('Plans')) {
                    let objectStore = db.createObjectStore("Plans", { autoIncrement: true });
                    if (DEBUG) console.debug(`${scriptInfo} Created new object store 'Plans'`);
                }
            };
        }

        function addPlan(plan) {
            return new Promise((resolve, reject) => {
                let openRequest = indexedDB.open("sbPlanManager");

                openRequest.onsuccess = function (event) {
                    let db = event.target.result;
                    let transaction = db.transaction(["Plans"], "readwrite");
                    let objectStore = transaction.objectStore("Plans");
                    let addRequest = objectStore.add(plan);

                    addRequest.onsuccess = function (event) {
                        if (DEBUG) console.debug(`${scriptInfo} Plan added successfully with ID: ${event.target.result}`);
                        resolve(event.target.result);
                    };

                    addRequest.onerror = function (event) {
                        console.error(`${scriptInfo} Error adding plan:`, event);
                        reject(event);
                    };
                };

                openRequest.onerror = function (event) {
                    console.error(`${scriptInfo} Error opening database:`, event);
                    reject(event);
                };
            });
        }

        function modifyPlan(planId, plan) {
            let openRequest = indexedDB.open("sbPlanManager");

            openRequest.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(["Plans"], "readwrite");
                let objectStore = transaction.objectStore("Plans");
                let putRequest = objectStore.put(plan, planId);

                putRequest.onsuccess = function (event) {
                    if (DEBUG) console.debug(`${scriptInfo} Plan modified successfully with ID: ${planId}`);
                };

                putRequest.onerror = function (event) {
                    console.error(`${scriptInfo} Error modifying plan with ID: ${planId}`, event);
                };
            };

            openRequest.onerror = function (event) {
                console.error(`${scriptInfo} Error opening database:`, event);
            };
        }

        function getAllPlans() {
            return new Promise((resolve, reject) => {
                let openRequest = indexedDB.open("sbPlanManager");

                openRequest.onsuccess = function (event) {
                    let db = event.target.result;
                    let transaction = db.transaction(["Plans"], "readonly");
                    let objectStore = transaction.objectStore("Plans");

                    let cursorRequest = objectStore.openCursor();

                    let plans = [];

                    cursorRequest.onsuccess = function (event) {
                        let cursor = event.target.result;
                        if (cursor) {
                            plans.push({ key: cursor.key, plan: cursor.value });
                            cursor.continue();
                        } else {
                            if (DEBUG) console.debug(`${scriptInfo} Plans retrieved successfully:`, plans);
                            resolve(plans);
                        }
                    };

                    cursorRequest.onerror = function (event) {
                        console.error(`${scriptInfo} Error retrieving plans:`, event);
                        reject(event);
                    };
                };

                openRequest.onerror = function (event) {
                    console.error(`${scriptInfo} Error opening database:`, event);
                    reject(event);
                };
            });
        }

        function deletePlan(planId) {
            let openRequest = indexedDB.open("sbPlanManager");

            openRequest.onsuccess = function (event) {
                let db = event.target.result;
                let transaction = db.transaction(["Plans"], "readwrite");
                let objectStore = transaction.objectStore("Plans");
                let deleteRequest = objectStore.delete(planId);

                deleteRequest.onsuccess = function (event) {
                    if (DEBUG) console.debug(`${scriptInfo} Plan deleted successfully with ID: ${planId}`);
                };

                deleteRequest.onerror = function (event) {
                    console.error(`${scriptInfo} Error deleting plan with ID: ${planId}`, event);
                };
            };

            openRequest.onerror = function (event) {
                onsole.error(`${scriptInfo} Error opening database:`, event);
            };
        }

        function getCurrentURL() {
            return window.location.protocol + "//" + window.location.host + window.location.pathname;
        }

        async function getTroopTemplates() {
            if (Date.now() - LAST_REQUEST < 200) {
                if (DEBUG) console.debug(`${scriptInfo} Too many requests!`);
                UI.ErrorMessage(twSDK.tt('Too many requests! Please wait a moment before trying again.'));
                return;
            }
            LAST_REQUEST = Date.now();
            let baseUrl
            if (game_data.player.sitter > 0) {
                baseUrl = getCurrentURL() + `?village=${game_data.village.id}&screen=place&mode=templates&t=${game_data.player.id}`;
            } else {
                baseUrl = getCurrentURL() + `?village=${game_data.village.id}&screen=place&mode=templates`;
            }


            let response = await fetch(baseUrl);
            let text = await response.text();

            let templateText = text.split('TroopTemplates.current = ')[1].split(';\n\tTroopTemplates.deleteLink =')[0]
            let troopTemplatesRaw = JSON.parse(templateText) ?? {};

            if (DEBUG) console.debug(`${scriptInfo}: Troop templates: `, troopTemplatesRaw);
            if (troopTemplatesRaw.length === 0) {
                console.warn(`${scriptInfo}: No troop templates found!`);
                return;
            }
            let troopTemplates = [];
            const units = game_data.units;
            if (DEBUG) console.debug(`${scriptInfo}: Units: `, units);
            for (let templateKey in troopTemplatesRaw) {
                let template = troopTemplatesRaw[templateKey];
                let templateUnits = {};
                for (let unit of units) {
                    templateUnits[unit] = template[unit] ?? 0;
                }
                for (let unitAll of template.use_all) {
                    templateUnits[unitAll] = 'all';
                }
                troopTemplates.push({ name: template.name, units: templateUnits });
                if (DEBUG) console.debug(`${scriptInfo}: Troop template ${template.name}: `, templateUnits);
            }
            if (DEBUG) console.debug(`${scriptInfo}: Troop templates: `, troopTemplates);
            let localStorageSettings = getLocalStorage();
            localStorageSettings.troopTemplates = troopTemplates;
            saveLocalStorage(localStorageSettings);
        }


        function resetInput() {
            let localStorageSettings = getLocalStorage();
            localStorageSettings.planSelector = '---';
            localStorageSettings.sendByTime = 0;
            localStorageSettings.sendByNumber = 0;
            localStorageSettings.useTemplates = true;
            saveLocalStorage(localStorageSettings);
            if (DEBUG) console.debug(`${scriptInfo} Input reset successfully, new settings:`, localStorageSettings);
            if ($('#sbPlanSelectorPopup').length > 0) {
                $('#sbPlanSelectorPopup').remove();
            }
            renderUI();
            addEventHandlers();
            initializeInputFields();
            if (DEBUG) console.debug(`${scriptInfo} UI re-rendered after input reset`);
        }

        function handleInputChange() {
            const inputId = $(this).attr('id');
            let inputValue;

            switch (inputId) {
                case "planSelector":
                    if ($('#sbPlanSelectorPopup').length > 0) {
                        $('#sbPlanSelectorPopup').remove();
                    }
                    inputValue = $(this).val();
                    for (let planId of planIds) {
                        planId === inputValue ? $(`#${planId}`).show() : $(`#${planId}`).hide();
                    }
                    inputValue === '---' ? $('#manageCommandsDiv').hide() : $('#manageCommandsDiv').show();
                    break;
                case "sendByTime":
                case "sendByNumber":
                    inputValue = parseInt($(this).val());
                    inputValue = inputValue < 0 ? 0 : inputValue;
                    $(this).val(inputValue);
                    break;
                case "useTemplates":
                    inputValue = $(this).is(':checked');
                    break;
                default:
                    if (DEBUG) console.debug(`${scriptInfo}: Unknown id: ${inputId}`);
            }
            if (DEBUG) console.debug(`${scriptInfo}: ${inputId} changed to ${inputValue}`);
            const settingsObject = getLocalStorage();
            settingsObject[inputId] = inputValue;
            saveLocalStorage(settingsObject);
            if (inputId === 'planSelector') fillTemplateTable();
        }

        function getLocalStorage() {
            const localStorageSettings = JSON.parse(localStorage.getItem('sbPlanManager'));
            const expectedSettings = [
                'planSelector',
                'sendByTime',
                'sendByNumber',
                'troopTemplates',
                'templateSelections',
                'planNames',
                'useTemplates'
            ];

            let missingSettings = [];
            if (localStorageSettings) {
                missingSettings = expectedSettings.filter(setting => !(setting in localStorageSettings));
                if (DEBUG && missingSettings.length > 0) console.debug(`${scriptInfo}: Missing settings in localStorage: `, missingSettings);
            }

            if (localStorageSettings && missingSettings.length === 0) {
                if (DEBUG) console.debug(`${scriptInfo}: Local storage settings retrieved successfully:`, localStorageSettings);
                return localStorageSettings;
            } else {
                const defaultSettings = {
                    planSelector: '---',
                    sendByTime: 0,
                    sendByNumber: 0,
                    troopTemplates: [],
                    templateSelections: {},
                    planNames: {},
                    useTemplates: true,
                };

                saveLocalStorage(defaultSettings);
                if (DEBUG) console.debug(`${scriptInfo}: Default settings saved to local storage:`, defaultSettings);

                return defaultSettings;
            }
        }
        function saveLocalStorage(settingsObject) {
            localStorage.setItem('sbPlanManager', JSON.stringify(settingsObject));
            if (DEBUG) console.debug(`${scriptInfo}: Settings saved to local storage:`, settingsObject);
        }

        async function fetchWorldConfigData() {
            try {
                const villages = await twSDK.worldDataAPI('village');
                const players = await twSDK.worldDataAPI('player');
                const tribes = await twSDK.worldDataAPI('ally');
                const worldUnitInfo = await twSDK.getWorldUnitInfo();
                const worldConfig = await twSDK.getWorldConfig();
                return { worldUnitInfo, worldConfig, tribes, players, villages };
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error while fetching the data!')
                );
                console.error(`${scriptInfo} Error:`, error);
            }
        }

        async function fetchTroopsForAllVillages() {
            const mobileCheck = jQuery('#mobileHeader').length > 0;
            const totalVillages = parseInt(game_data.player.villages);
            const troopsForGroup = {}; // Changed from array to object
            let pageSize = 0;

            // Function to fetch and process data for a single page
            async function fetchPageData(page) {
                const response = await jQuery.get(
                    game_data.link_base_pure +
                    `overview_villages&mode=combined&group=0&page=${page}`
                );

                const htmlDoc = jQuery.parseHTML(response);
                const homeTroops = [];

                if (pageSize === 0) {
                    pageSize = parseInt(jQuery(htmlDoc).find("input[name='page_size']").val(), 10);
                }

                if (mobileCheck) {
                    let table = jQuery(htmlDoc).find('#combined_table tr.nowrap');
                    for (let i = 0; i < table.length; i++) {
                        let objTroops = {};
                        let villageId = parseInt(
                            table[i]
                                .getElementsByClassName('quickedit-vn')[0]
                                .getAttribute('data-id')
                        );
                        let listTroops = Array.from(
                            table[i].getElementsByTagName('img')
                        )
                            .filter((e) => e.src.includes('unit'))
                            .map((e) => ({
                                name: e.src
                                    .split('unit_')[1]
                                    .replace('@2x.webp', ''),
                                value: parseInt(
                                    e.parentElement.nextElementSibling.innerText
                                ),
                            }));
                        listTroops.forEach((item) => {
                            objTroops[item.name] = item.value;
                        });

                        objTroops.villageId = villageId;
                        objTroops.coord = villageMap.get(parseInt(villageId));

                        homeTroops.push(objTroops);
                    }
                } else {
                    const combinedTableRows = jQuery(htmlDoc).find(
                        '#combined_table tr.nowrap'
                    );
                    const combinedTableHead = jQuery(htmlDoc).find(
                        '#combined_table tr:eq(0) th'
                    );

                    const combinedTableHeader = [];

                    // collect possible buildings and troop types
                    jQuery(combinedTableHead).each(function () {
                        const thImage = jQuery(this).find('img').attr('src');
                        if (thImage) {
                            let thImageFilename = thImage.split('/').pop();
                            thImageFilename = thImageFilename.replace('.webp', '');
                            combinedTableHeader.push(thImageFilename);
                        } else {
                            combinedTableHeader.push(null);
                        }
                    });

                    // collect possible troop types
                    combinedTableRows.each(function () {
                        let rowTroops = {};

                        combinedTableHeader.forEach((tableHeader, index) => {
                            if (tableHeader) {
                                if (tableHeader.includes('unit_')) {
                                    const villageId = jQuery(this)
                                        .find('td:eq(1) span.quickedit-vn')
                                        .attr('data-id');
                                    const unitType = tableHeader.replace(
                                        'unit_',
                                        ''
                                    );
                                    rowTroops = {
                                        ...rowTroops,
                                        villageId: parseInt(villageId),
                                        [unitType]: parseInt(
                                            jQuery(this)
                                                .find(`td:eq(${index})`)
                                                .text()
                                        ),
                                    };
                                }
                            }
                        });
                        rowTroops.coord = villageMap.get(parseInt(rowTroops.villageId));
                        homeTroops.push(rowTroops);
                    });
                }

                return homeTroops;
            }

            try {
                if (totalVillages <= 1000) {
                    // If the player has less than or equal to 1000 villages, use page=-1 for efficiency
                    UI.SuccessMessage(twSDK.tt('Fetching troop data...'));
                    const homeTroops = await fetchPageData(-1);

                    // Convert array to object with villageId as keys
                    homeTroops.forEach(troops => {
                        troopsForGroup[troops.villageId] = troops;
                    });
                } else {
                    UI.SuccessMessage(twSDK.tt('Fetching troop data for a large account. This may take a while...'));
                    let page = 0;
                    let totalProcessedVillages = 0;

                    // Loop through pages until all villages are processed
                    while (totalProcessedVillages < totalVillages) {
                        const homeTroops = await fetchPageData(page);

                        // Convert array to object with villageId as keys
                        homeTroops.forEach(troops => {
                            troopsForGroup[troops.villageId] = troops;
                        });

                        totalProcessedVillages += homeTroops.length;

                        // If the number of processed villages is less than the page size, we have reached the last page
                        if (homeTroops.length < pageSize) {
                            break;
                        }

                        page++;
                        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for 200 ms before the next request
                    }
                    UI.SuccessMessage(twSDK.tt('Troop data fetched successfully!'));
                }

                return troopsForGroup; // Now returning an object with village IDs as keys
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There was an error while fetching the data!')
                );
                console.error(`${scriptInfo} Error:`, error);
                return {};  // Return empty object instead of empty array on error
            }
        }
    }
);
