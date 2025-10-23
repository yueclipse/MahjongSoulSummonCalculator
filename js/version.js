const CONFIG_VERSION = '1.0.1';
const TRANSLATION_VERSION = '1.1.0';

async function fetchConfig() {
    try {
        const response = await fetch(`CalculatorConfig.json?v=${CONFIG_VERSION}`);
        return await response.json();
    } catch(error) {
        console.log('Fail to load CalculatorConfig.json');
    }
    return getDefaultConfig();
}

function getDefaultConfig() {
    return {
        "pools": {
            "event": {
                "probability": 0.0,
                "maxCharacters": 0
            },
            "limited": {
                "probability": 0.01,
                "maxCharacters": 1
            },
            "collab": {
                "probability": 0.0295,
                "maxCharacters": 4
            },
            "doubleup": {
                "probability": 0.0295,
                "maxCharacters": 2
            },
            "singleup": {
                "probability": 0.0295,
                "maxCharacters": 1
            },
            "normal": {
                "probability": 0.05,
                "maxCharacters": 1
            }
        }
    }
}

async function fetchLocalization() {
    try {
        const response = await fetch(`i18n/zh-TW.json?v=${TRANSLATION_VERSION}`);
        return new LanguageManager(await response.json());
    } catch(error) {
        console.log('Fail to load zh-TW.json and initialize LanguageManager');
    }
    return null;
}