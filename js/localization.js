class LanguageManager {
	constructor(translations) {
		this.currentLanguage = this.detectLanguage();
		document.getElementById('language-selector').value = this.currentLanguage;
		this.translations = translations;
	}

	detectLanguage() {
		const saved = localStorage.getItem('preferred-language');
		if(saved) 
			return saved;

		const browserLang = navigator.language || navigator.userLanguage;
		if(browserLang.includes('TW')) 
			return 'zh-TW';

		return 'en';
	}

	setLanguage(language) {
		this.currentLanguage = language;
		localStorage.setItem('preferred-language', language);
		this.updatePage();
	}

	translate(key) {
		if(this.currentLanguage == 'en')
			return key; // origial English text
		return this.translations[key] ? this.translations[key] : key;
	}

	updatePage() {
		const elements = document.querySelectorAll('[data-translate]');

		elements.forEach(element => {
			const key = element.getAttribute('data-translate');
			element.textContent = this.translate(key);
		});

		document.title = this.translate('Mahjong Soul Summon Calculator');

		pools.forEach(pool => {
			SetupCharacterDisplay(pool);
		    document.getElementById(`${pool}-score-explanation-section`).innerHTML = createLuckScoreExplanation(pool);
		});

		// Setup event text
        document.getElementById('event-btn').textContent = config.pools.event.buttonTitle[languageManager.currentLanguage];
        document.getElementById('event-title').textContent = config.pools.event.title[languageManager.currentLanguage];
	}
}

let languageManager = null;

async function initLocalization() {
    try {
        const response = await fetch('i18n/zh-TW.json');
        languageManager = new LanguageManager(await response.json());
        languageManager.updatePage();
    } catch(error) {
        console.log('Fail to load zh-TW.json and initialize LanguageManager');
    }

	document.getElementById('language-selector').addEventListener('change', function() {
		if(languageManager) languageManager.setLanguage(this.value);
	});
}

function t(key, vars = {}) {
	let text = languageManager ? languageManager.translate(key) : key;
	for(const [k, v] of Object.entries(vars))
		text = text.replace(`{${k}}`, v);
	return text;
}