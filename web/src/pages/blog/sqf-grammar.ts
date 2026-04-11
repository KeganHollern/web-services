import type { LanguageRegistration } from "shiki";

export const sqfGrammar: LanguageRegistration = {
  name: "sqf",
  scopeName: "source.sqf",
  displayName: "SQF",
  aliases: [],
  patterns: [
    { include: "#comments" },
    { include: "#preprocessor" },
    { include: "#strings" },
    { include: "#numbers" },
    { include: "#constants" },
    { include: "#keywords" },
    { include: "#commands" },
    { include: "#local-variable" },
    { include: "#operators" },
    { include: "#punctuation" },
  ],
  repository: {
    comments: {
      patterns: [
        { match: "//.*$", name: "comment.line.double-slash.sqf" },
        {
          begin: "/\\*",
          end: "\\*/",
          name: "comment.block.sqf",
        },
      ],
    },
    preprocessor: {
      patterns: [
        {
          match:
            "^\\s*#\\s*(include|define|undef|ifdef|ifndef|if|else|elif|endif|pragma|line|error)\\b",
          name: "keyword.control.directive.sqf",
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: "string.quoted.double.sqf",
          begin: '"',
          end: '"',
          patterns: [
            { match: '""', name: "constant.character.escape.sqf" },
          ],
        },
        {
          name: "string.quoted.single.sqf",
          begin: "'",
          end: "'",
          patterns: [
            { match: "''", name: "constant.character.escape.sqf" },
          ],
        },
      ],
    },
    numbers: {
      patterns: [
        {
          match: "\\b0[xX][0-9a-fA-F]+\\b",
          name: "constant.numeric.hex.sqf",
        },
        {
          match:
            "\\b\\$[0-9a-fA-F]+\\b",
          name: "constant.numeric.hex.sqf",
        },
        {
          match:
            "\\b[0-9]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b",
          name: "constant.numeric.sqf",
        },
      ],
    },
    constants: {
      patterns: [
        {
          match:
            "(?i)\\b(true|false|nil|objNull|grpNull|controlNull|displayNull|scriptNull|teamMemberNull|locationNull|taskNull|netNull|configNull|player|thisList|this|_this|_x|_forEachIndex|_exception)\\b",
          name: "constant.language.sqf",
        },
      ],
    },
    keywords: {
      patterns: [
        {
          match:
            "(?i)\\b(if|then|else|exitWith|while|do|from|to|step|for|forEach|switch|case|default|try|catch|throw|with|waitUntil|params|private|scopeName|breakTo|breakOut|breakWith|continue|continueWith)\\b",
          name: "keyword.control.sqf",
        },
      ],
    },
    commands: {
      patterns: [
        {
          match:
            "(?i)\\b(call|callExtension|spawn|execVM|exec|execFSM|preprocessFileLineNumbers|preprocessFile|loadFile|compile|compileFinal|compileScript|format|formatText|hint|hintSilent|hintC|hintCadet|diag_log|diag_tickTime|diag_frameno|systemChat|globalChat|sideChat|groupChat|vehicleChat|sleep|uiSleep|terminate|scriptDone|canSuspend|assert|toString|toArray|toUpper|toLower|toFixed|parseNumber|parseText|parseSimpleArray|str|typeName|typeOf|isNil|isNull|isEqualTo|isEqualType|isEqualRef|isKindOf|count|select|selectRandom|selectRandomWeighted|pushBack|pushBackUnique|append|apply|sort|reverse|arrayIntersect|set|resize|deleteAt|deleteRange|insert|find|findIf|findDisplay|in|param|floor|ceil|round|abs|sqrt|min|max|sin|cos|tan|asin|acos|atan|atan2|log|ln|exp|deg|rad|random|createVehicle|createUnit|createGroup|createDisplay|createDialog|deleteVehicle|deleteGroup|addAction|removeAction|removeAllActions|addEventHandler|removeEventHandler|removeAllEventHandlers|addMissionEventHandler|removeMissionEventHandler|publicVariable|publicVariableClient|publicVariableServer|remoteExec|remoteExecCall|remoteExecutedOwner|isServer|isDedicated|isMultiplayer|hasInterface|getVariable|setVariable|missionNamespace|uiNamespace|profileNamespace|parsingNamespace|currentNamespace|configFile|missionConfigFile|campaignConfigFile|getText|getNumber|getArray|configName|inheritsFrom|configProperties|configClasses|configHierarchy|nearestObject|nearestObjects|nearEntities|nearestBuilding|nearestLocation|getPos|getPosATL|getPosASL|getPosASLW|setPos|setPosATL|setPosASL|position|worldToScreen|screenToWorld|vectorAdd|vectorDiff|vectorMultiply|vectorMagnitude|vectorNormalized|vectorDistance|vectorDotProduct|vectorCrossProduct|velocity|setVelocity|getDir|setDir|direction|setDamage|damage|alive|allowDamage|addBackpack|removeBackpack|backpack|weapons|addWeapon|removeWeapon|removeAllWeapons|currentWeapon|magazines|addMagazine|removeMagazine|ammo|setAmmo|createMarker|deleteMarker|setMarkerPos|setMarkerText|setMarkerType|setMarkerColor|setMarkerSize|setMarkerAlpha|getMarkerColor|getMarkerPos|getMarkerSize|getMarkerType|markerText|text|ctrlText|ctrlSetText|ctrlCreate|ctrlDelete|ctrlShow|ctrlEnable|ctrlSetPosition|ctrlCommit|ctrlParent|ctrlParentControlsGroup|displayCtrl|findDisplay|lbClear|lbAdd|lbSetData|lbData|lbValue|lbText|lbColor|lbPicture|lbCurSel|lbSetCurSel|lbSize|player|allPlayers|allUnits|allDead|vehicle|crew|driver|gunner|commander|group|units|side|playerSide|enableSimulation|enableSimulationGlobal|hideObject|hideObjectGlobal|setObjectTexture|setObjectTextureGlobal|setFeatureType|name|setName|setIdentity|rating|score|attachTo|detach|lookAt|setViewDistance|viewDistance|fadeMusic|fadeSound|playMusic|playSound|playSound3D|say|say3D|cutText|cutRsc|cutObj|titleText|titleRsc|titleObj|onEachFrame|onMapSingleClick|addDiarySubject|addDiaryRecord|createDiaryRecord|removeDiaryRecord|saveGame|loadGame|endMission|forceEnd|failMission|nearestTerrainObjects|terrainIntersect|terrainIntersectASL|lineIntersectsSurfaces|lineIntersects|intersect|roadsConnectedTo|roadAt|getConnectedRoads|getConnectedUAV|connectTerminalToUAV|createTrigger|triggerArea|triggerStatements|triggerActivation|setTriggerArea|setTriggerStatements|setTriggerActivation|list|isTriggerActivated|enableDynamicSimulation|dynamicSimulationEnabled|enableAI|disableAI|doMove|commandMove|moveTo|stop|doStop|doFollow|doWatch|doTarget|forceWeaponFire|fireAtTarget|reveal|knowsAbout|targets|enemy|friendly|splitString|joinString|regexMatch|regexReplace|regexFind|trim)\\b",
          name: "support.function.sqf",
        },
      ],
    },
    "local-variable": {
      patterns: [
        {
          match: "\\b_[A-Za-z_][A-Za-z0-9_]*\\b",
          name: "variable.other.local.sqf",
        },
      ],
    },
    operators: {
      patterns: [
        {
          match:
            "(?i)\\b(and|or|not|mod|min|max)\\b",
          name: "keyword.operator.logical.sqf",
        },
        {
          match: "&&|\\|\\||!=|==|<=|>=|<|>|!",
          name: "keyword.operator.comparison.sqf",
        },
        {
          match: "=|\\+=|-=|\\*=|/=",
          name: "keyword.operator.assignment.sqf",
        },
        {
          match: "\\+|-|\\*|/|%|\\^",
          name: "keyword.operator.arithmetic.sqf",
        },
      ],
    },
    punctuation: {
      patterns: [
        { match: ";", name: "punctuation.terminator.statement.sqf" },
        { match: ",", name: "punctuation.separator.sqf" },
        { match: "[\\[\\]]", name: "punctuation.section.array.sqf" },
        { match: "[{}]", name: "punctuation.section.block.sqf" },
        { match: "[()]", name: "punctuation.section.parens.sqf" },
      ],
    },
  },
};
