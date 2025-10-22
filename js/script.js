const pools = ['event', 'limited', 'collab', 'doubleup', 'singleup', 'normal', 'custom'];
let config = null;
let bExplanationExpanded = false;

document.addEventListener('DOMContentLoaded', async function() {
    // Load config.json
    config = await fetchConfig();

    await initLocalization();

    // Setup event section if event probability is set.
    const eventBtn = document.getElementById('event-btn');
    if(config.pools.event.probability > 0) {
        eventBtn.classList.add('visible');
        document.getElementById('event-content').classList.add('active');
        let buttonTitle = languageManager ? config.pools.event.buttonTitle[languageManager.currentLanguage] : config.pools.event.buttonTitle['en'];
        document.getElementById('event-btn').textContent = buttonTitle;
        let title = languageManager ? config.pools.event.title[languageManager.currentLanguage] : config.pools.event.title['en'];
        document.getElementById('event-title').textContent = title;
        if(config.pools.event.maxCharacters <= 1) {
            document.getElementById('s-event-label').style.display = 'none';
            document.getElementById('s-event').style.display = 'none';
        }
    } else {
        // Otherwise, default at limited
        document.getElementById('limited-content').classList.add('active');
    }

    // Setup character portraits
    pools.forEach(pool => {
        SetupCharacterDisplay(pool);
    });

    // Setup button listener
    pools.forEach(pool => {
        document.getElementById(`${pool}-btn`).addEventListener('click', () => {
            // Hide all contents
            document.querySelectorAll('.content').forEach(content => {
                content.classList.remove('active');
            });
            // Show selected content
            document.getElementById(`${pool}-content`).classList.add('active');
            
            SetupExplanation(`${pool}`);
        });
    });
});

function printPercentage(p) {
    console.log(p);
    if(p > 0.9999)
        return '> 99.99%';
    else if(p < 0.0001)
        return '< 0.01%';
    return `${(p * 100).toFixed(2)}%`;
}

function calculateSuccessProbability(n, m, s, p) {
    const p_each = p / m;
    let dp = new Array(m + 1).fill(0);
    dp[s] = 1;
    for (let i = 0; i < n; i++) {
        let next = new Array(m + 1).fill(0);
        for (let j = s; j <= m; j++) {
            const p_add = (m - j) * p_each;
            next[j] += dp[j] * (1 - p_add);
            if (j < m) next[j + 1] += dp[j] * p_add;
        }
        dp = next;
    }
    return dp;
}

function calculateEventSuccessProbability() {
    const n = parseInt(document.getElementById('n-event').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-event')) return;
    const s = config.pools.event.maxCharacters > 1 ? parseInt(document.getElementById('s-event').value) : 0;
    if(!validateInput(s, config.settings.sMin, config.pools.event.maxCharacters - 1, 's-event')) return;
    let dp = calculateSuccessProbability(n, config.pools.event.maxCharacters, s, config.pools.event.probability);
    if(config.pools.event.maxCharacters > 1) { 
        let output = '';
        let sum = 0;
        for(let i = s; i < config.pools.event.maxCharacters && i - s + 1 <= n; i++) {
            sum += dp[i];
            output += t("At least {0} new event Jyanshi(s): {1}<br>", {0: i - s + 1, 1: printPercentage(1 - sum)});
        }
        document.getElementById('output-event-success').innerHTML = `<p>${output}</p>`;
    } else {
        let result = 1 - dp[0];
        document.getElementById('output-event-success').textContent = t("Probability of success: {0}", {0: printPercentage(result)});
    }
}

function calculateLimitedSuccessProbability() {
    const n = parseInt(document.getElementById('n-limited').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-limited')) return;
    let dp = calculateSuccessProbability(n, config.pools.limited.maxCharacters, 0, config.pools.limited.probability);
    let result = 1 - dp[0];
    document.getElementById('output-limited-success').textContent = t("Probability of success: {0}", {0: printPercentage(result)});
}

function calculateCollabSuccessProbability() {
    const n = parseInt(document.getElementById('n-collab').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-collab')) return;
    const s = parseInt(document.getElementById('s-collab').value);
    if(!validateInput(s, config.settings.sMin, config.pools.collab.maxCharacters - 1, 's-collab')) return;
    let dp = calculateSuccessProbability(n, config.pools.collab.maxCharacters, s, config.pools.collab.probability);
    let output = '';
    let sum = 0;
    for(let i = s; i < config.pools.collab.maxCharacters && i - s + 1 <= n; i++) {
        sum += dp[i];
        output += t("At least {0} new collaboration Jyanshi(s): {1}<br>", {0: i - s + 1, 1: printPercentage(1 - sum)});
    }
    document.getElementById('output-collab-success').innerHTML = `<p>${output}</p>`;
}

function calculateDoubleUpSuccessProbability() {
    const n = parseInt(document.getElementById('n-doubleup').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-doubleup')) return;
    const s = parseInt(document.getElementById('s-doubleup').value);
    if(!validateInput(s, config.settings.sMin, config.pools.doubleup.maxCharacters - 1, 's-doubleup')) return;
    let dp = calculateSuccessProbability(n, config.pools.doubleup.maxCharacters, s, config.pools.doubleup.probability);
    let output = '';
    let sum = 0;
    for(let i = s; i < config.pools.doubleup.maxCharacters && i - s + 1 <= n; i++) {
        sum += dp[i];
        output += t("At least {0} new rate-up Jyanshi(s): {1}<br>", {0: i - s + 1, 1: printPercentage(1 - sum)});
    }
    document.getElementById('output-doubleup-success').innerHTML = `<p>${output}</p>`;
}

function calculateSingleUpSuccessProbability() {
    const n = parseInt(document.getElementById('n-singleup').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-singleup')) return;
    let dp = calculateSuccessProbability(n, config.pools.singleup.maxCharacters, 0, config.pools.singleup.probability);
    let result = 1 - dp[0];
    document.getElementById('output-singleup-success').textContent = t("Probability of success: {0}", {0: printPercentage(result)});
}

function calculateNormalSuccessProbability() {
    const n = parseInt(document.getElementById('n-normal').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-normal')) return;
    let dp = calculateSuccessProbability(n, config.pools.normal.maxCharacters, 0, config.pools.normal.probability);
    let result = 1 - dp[0];
    document.getElementById('output-normal-success').textContent = t("Probability of success: {0}", {0: printPercentage(result)});
}

function calculateCustomSuccessProbability() {
    let prob = parseFloat(document.getElementById('p-custom').value);
    if(!validateInput(prob, config.settings.pMin, config.settings.pMax, 'p-custom')) return;
    const p = prob / 100;
    const m = parseInt(document.getElementById('m-custom').value);
    if(!validateInput(m, config.settings.mMin, config.settings.mMax, 'm-custom')) return;
    const n = parseInt(document.getElementById('n-custom').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-custom')) return;
    const s = m > 1 ? parseInt(document.getElementById('s-custom').value) : 0;
    if(!validateInput(s, config.settings.sMin, m - 1, 's-custom')) return;
    let dp = calculateSuccessProbability(n, m, s, p);
    if(m > 1) { 
        let output = '';
        let sum = 0;
        for(let i = s; i < m; i++) {
            sum += dp[i];
            output += t("At least {0} new prize(s): {1}<br>", {0: i - s + 1, 1: printPercentage(1 - sum)});
        }
        document.getElementById('output-custom-success').innerHTML = `<p>${output}</p>`;
    } else {
        let result = 1 - dp[0];
        document.getElementById('output-custom-success').textContent = t("Probability of success: {0}", {0: printPercentage(result)});
    }
}

// CDF
function calculateCumulativeDistribution(n, p, k) {
    if(k < 0) return 0;
    if(k >= n) return 1;
    let prob = Math.pow(1 - p, n); // P(X=0)
    let sum = prob;
    for(let i = 0; i < k; i++) {
        // P(X=i+1) = P(X=i) * (n-i)/(i+1) * p / (1-p)
        prob *= (n - i) / (i + 1) * p / (1 - p);
        sum += prob;
    }
    return sum;
}

function calculateLuckScore(pool, p) {
    if(pool == 'custom') {
        p = parseFloat(document.getElementById('p-custom').value);
        if(!validateInput(p, config.settings.pMin, config.settings.pMax, 'p-custom')) return;
        p /= 100;
    }
    const n = parseInt(document.getElementById(`n-${pool}-score`).value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, `n-${pool}-score`)) return;
    const k = parseInt(document.getElementById(`k-${pool}-score`).value);
    if(!validateInput(k, config.settings.kMin, n, `k-${pool}-score`)) return;
    let result = calculateCumulativeDistribution(n, p, k);
    console.log(result);
    var rating;
    if(result <= 0.01) rating = t('Extreme Unlucky');
    if(result > 0.01 && result <= 0.05) rating = t('Very Unlucky');
    if(result > 0.05 && result <= 0.2) rating = t('Unlucky');
    if(result > 0.2 && result < 0.8) rating = t('Average');
    if(result >= 0.8 && result < 0.95) rating = t('Lucky');
    if(result >= 0.95 && result < 0.99) rating = t('Very Lucky');
    if(result >= 0.99) rating = t('Extreme Lucky');
    document.getElementById(`output-${pool}-score`).textContent = t("Luck Score: {0} ({1})", {0: (result * 100).toFixed(1), 1: rating});
}

function validateInput(num, min, max, id) {
    let input = document.getElementById(`${id}`);
    let error = document.getElementById(`${id}-error`);
    if(min <= num && num <= max) {
        input.classList.remove('invalid');
        error.classList.remove('visible');
        return true;
    }
    input.classList.add('invalid');
    error.classList.add('visible');
    error.textContent = t("Please enter a number between {0} and {1}.", {0: min, 1: max});
    return false;
}

function createLuckScoreExplanation(pool) {
    if(languageManager && languageManager.currentLanguage == 'zh-TW') return `
        <button class="explanation-toggle" onclick="toggleExplanation('${pool}')">
            <span id="${pool}-score-explanation-arrow">▶</span> 什麼是幸運分數?
        </button>
        <div id="${pool}-score-explanation" class="explanation-content">
            <p>幸運分數表示你的尋覓結果與統計預期相比是偏幸運還是不幸運。
            詳情可參考 <a href="https://zh.wikipedia.org/zh-tw/%E7%B4%AF%E7%A7%AF%E5%88%86%E5%B8%83%E5%87%BD%E6%95%B0" target="_blank" rel="noopener noreferrer">累積分布函數 (CDF)</a> 。
            </p>
            <p>綜合統計上的 <a href="https://zh.wikipedia.org/zh-tw/P%E5%80%BC" target="_blank" rel="noopener noreferrer">p值</a> 標準，還有我們日常對「幸運」的直覺，這裡提供一些建議的分界點：</p>
            <ul>
                <li><strong>0-1:</strong> 非洲酋長 - 你位於玩家底部 1%</li>
                <li><strong>1-5:</strong> 大非洲人 - 顯著低於平均</li>
                <li><strong>5-20:</strong> 非洲人 - 低於平均但不罕見</li>
                <li><strong>20-80:</strong> 普通人 - 正常範圍</li>
                <li><strong>80-95:</strong> 歐洲人 - 高於平均</li>
                <li><strong>95-99:</strong> 大歐洲人 - 顯著高於平均</li>
                <li><strong>99-100:</strong> 歐洲教皇 - 你位於玩家頂端 1%</li>
            </ul>
            <p>
                舉例來說，幸運分數為 25 表示有 25% 的玩家獲得的雀士數量與你相同或更少，而其餘的 75% 會獲得更多雀士。<br>
            </p>
        </div>
    `;
    
    return `
        <button class="explanation-toggle" onclick="toggleExplanation('${pool}')">
            <span id="${pool}-score-explanation-arrow">▶</span> What is Luck Score?
        </button>
        <div id="${pool}-score-explanation" class="explanation-content">
            <p>The Luck Score represents how lucky or unlucky your summon results are compared to what would be expected statistically.
            See <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function" target="_blank" rel="noopener noreferrer">Cumulative distribution function (CDF)</a>.</p>
            <p>Based on both statistical <a href="https://en.wikipedia.org/wiki/P-value" target="_blank" rel="noopener noreferrer">p-values</a> and our everyday sense of what feels lucky, here are the suggested cutoffs:</p>
            <ul>
                <li><strong>0-1:</strong> Extreme Unlucky - You're in the bottom 1% of players</li>
                <li><strong>1-5:</strong> Very Unlucky - Significantly below average</li>
                <li><strong>5-20:</strong> Unlucky - Below average but not rare</li>
                <li><strong>20-80:</strong> Average - Normal expected range</li>
                <li><strong>80-95:</strong> Lucky - Above average</li>
                <li><strong>95-99:</strong> Very Lucky - Significantly above average</li>
                <li><strong>99-100:</strong> Extreme Lucky - You're in the top 1% of players</li>
            </ul>
            <p>
                For example, a Luck Score of 25 means that 25% of players would get the same or fewer Jyanshis than you, while 75% would get more.<br>
            </p>
        </div>
    `;
}

function toggleExplanation(pool) {
    bExplanationExpanded = !bExplanationExpanded;
    SetupExplanation(pool);
}

function SetupExplanation(pool) {
    const explanation = document.getElementById(`${pool}-score-explanation`);
    const arrow = document.getElementById(`${pool}-score-explanation-arrow`);
    
    if (!bExplanationExpanded) {
        explanation.classList.remove('visible');
        arrow.textContent = '▶';
    } else {
        explanation.classList.add('visible');
        arrow.textContent = '▼';
    }
}

function SetupCharacterDisplay(pool) {
    if(config.pools[pool] && config.pools[pool].characterImages) {
        // Portrait
        const characterDisplay = document.getElementById(`${pool}-character-display`);
        characterDisplay.innerHTML = '';
        config.pools[pool].characterImages.forEach(filename => {
            const img = document.createElement('img');
            img.src = filename;
            img.loading = 'lazy';
            img.alt = "";
            img.className = 'character-portrait';
            characterDisplay.appendChild(img);
        });
        // Description
        const description = document.createElement('div');
        description.className = 'character-description';
        if(config.pools[pool].characterDescription) {
            description.innerHTML = languageManager ? config.pools[pool].characterDescription[languageManager.currentLanguage] : config.pools[pool].characterDescription['en'];
            if(description.textContent.length > 0)
                characterDisplay.appendChild(description);
        }
    }
}