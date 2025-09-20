let config = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Load config.json
    try {
        const response = await fetch('CalculatorConfig.json');
        config = await response.json();
    } catch(error) {
        console.log('Fail to load CalculatorConfig.json');
        config = getDefaultConfig();
    }

    // Setup event section if event probability is set.
    const eventBtn = document.getElementById('event-btn');
    if(config.pools.event.probability > 0) {
        eventBtn.classList.add('visible');
        document.getElementById('event-btn').textContent = config.pools.event.buttonTitle;
        document.getElementById('event-content').classList.add('active');
        document.getElementById('event-title').textContent = config.pools.event.title;
        if(config.pools.event.maxCharacters <= 1) {
            document.getElementById('s-event-label').style.display = 'none';
            document.getElementById('s-event').style.display = 'none';
        }
    } else {
        // Otherwise, default at limited
        document.getElementById('limited-content').classList.add('active');
    }

    // Set up button listener
    const buttons = {
        'event-btn': 'event-content',
        'limited-btn': 'limited-content',
        'normal-btn': 'normal-content',
        'rateup-btn': 'rateup-content',
        'collab-btn': 'collab-content',
        'custom-btn': 'custom-content'
    };

    Object.entries(buttons).forEach(([btnId, contentId]) => {
        document.getElementById(btnId).addEventListener('click', () => {
            // Hide all contents
            document.querySelectorAll('.content').forEach(content => {
                content.classList.remove('active');
            });
            // Show selected content
            document.getElementById(contentId).classList.add('active');
        });
    });

    // Set up score explanation
    const pools = ['event', 'limited', 'collab', 'rateup', 'normal', 'custom'];

    pools.forEach(pool => {
        document.getElementById(`${pool}-score-explanation-section`).innerHTML = createLuckScoreExplanation(pool);
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
        for(let i = s; i < config.pools.event.maxCharacters; i++) {
            sum += dp[i];
            output += `At least ${i - s + 1} new event character(s): ${printPercentage(1 - sum)}<br>`;
        }
        document.getElementById('output-event-success').innerHTML = `<p>${output}</p>`;
    } else {
        let result = 1 - dp[0];
        document.getElementById('output-event-success').textContent = `Probability of success: ${printPercentage(result)}`;
    }
}

function calculateLimitedSuccessProbability() {
    const n = parseInt(document.getElementById('n-limited').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-limited')) return;
    let dp = calculateSuccessProbability(n, config.pools.limited.maxCharacters, 0, config.pools.limited.probability);
    let result = 1 - dp[0];
    document.getElementById('output-limited-success').textContent = `Probability of success: ${printPercentage(result)}`;
}

function calculateCollabSuccessProbability() {
    const n = parseInt(document.getElementById('n-collab').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-collab')) return;
    const s = parseInt(document.getElementById('s-collab').value);
    if(!validateInput(s, config.settings.sMin, config.pools.collab.maxCharacters - 1, 's-collab')) return;
    let dp = calculateSuccessProbability(n, config.pools.collab.maxCharacters, s, config.pools.collab.probability);
    let output = '';
    let sum = 0;
    for(let i = s; i < config.pools.collab.maxCharacters; i++) {
        sum += dp[i];
        output += `At least ${i - s + 1} new collaborate character(s): ${printPercentage(1 - sum)}<br>`;
    }
    document.getElementById('output-collab-success').innerHTML = `<p>${output}</p>`;
}

function calculateRateupSuccessProbability() {
    const n = parseInt(document.getElementById('n-rateup').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-rateup')) return;
    const s = parseInt(document.getElementById('s-rateup').value);
    if(!validateInput(s, config.settings.sMin, config.pools.rateup.maxCharacters - 1, 's-rateup')) return;
    let dp = calculateSuccessProbability(n, config.pools.rateup.maxCharacters, s, config.pools.rateup.probability);
    let output = '';
    let sum = 0;
    for(let i = s; i < config.pools.rateup.maxCharacters; i++) {
        sum += dp[i];
        output += `At least ${i - s + 1} new rate-up character(s): ${printPercentage(1 - sum)}<br>`;
    }
    document.getElementById('output-rateup-success').innerHTML = `<p>${output}</p>`;
}

function calculateNormalSuccessProbability() {
    const n = parseInt(document.getElementById('n-normal').value);
    if(!validateInput(n, config.settings.nMin, config.settings.nMax, 'n-normal')) return;
    let dp = calculateSuccessProbability(n, config.pools.normal.maxCharacters, 0, config.pools.normal.probability);
    let result = 1 - dp[0];
    document.getElementById('output-normal-success').textContent = `Probability of success: ${printPercentage(result)}`;
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
            output += `At least ${i - s + 1} new prize(s): ${printPercentage(1 - sum)}<br>`;
        }
        document.getElementById('output-custom-success').innerHTML = `<p>${output}</p>`;
    } else {
        let result = 1 - dp[0];
        document.getElementById('output-custom-success').textContent = `Probability of success: ${printPercentage(result)}`;
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
    // 68-95-99.7
    if(result <= 0.0015) rating = 'Extreme Unlucky';
    if(result > 0.0015 && result <= 0.025) rating = 'Very Unlucky';
    if(result > 0.025 && result <= 0.16) rating = 'Unlucky';
    if(result > 0.16 && result < 0.84) rating = 'Average';
    if(result >= 0.84 && result < 0.975) rating = 'Lucky';
    if(result >= 0.975 && result < 0.9985) rating = 'Very Lucky';
    if(result >= 0.9985) rating = 'Extreme Lucky';
    document.getElementById(`output-${pool}-score`).textContent = `Luck Score: ${(result * 100).toFixed(1)} (${rating})`;
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
            "rateup": {
                "probability": 0.0295,
                "maxCharacters": 2
            },
            "normal": {
                "probability": 0.05,
                "maxCharacters": 1
            }
        }
    }
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
    error.textContent = `Please enter a number between ${min} and ${max}.`;
    return false;
}

function createLuckScoreExplanation(pool) {
    return `
        <button class="explanation-toggle" onclick="toggleExplanation('${pool}')">
            <span id="${pool}-score-explanation-arrow">▶</span> What is Luck Score?
        </button>
        <div id="${pool}-score-explanation" class="explanation-content">
            <p>The Luck Score represents how lucky or unlucky your summon results are compared to what would be expected statistically.
            See <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function" target="_blank" rel="noopener noreferrer">Cumulative distribution function (CDF)</a></p>
            <ul>
                <li><strong>0-0.15:</strong> Extreme unlucky - You're in the bottom 0.15% of players</li>
                <li><strong>0.15-2.5:</strong> Very unlucky - Significantly below average</li>
                <li><strong>2.5-16:</strong> Unlucky - Below average but not rare</li>
                <li><strong>16-84:</strong> Average - Normal expected range</li>
                <li><strong>84-97.5:</strong> Lucky - Above average</li>
                <li><strong>97.5-99.85:</strong> Very Lucky - Significantly above average</li>
                <li><strong>99.85-100:</strong> Extreme Lucky - You're in the top 0.15% of players</li>
            </ul>
            <p>For example, a luck score of 25 means that 25% of players would get the same or fewer characters than you, while 75% would get more.</p>
        </div>
    `;
}

function toggleExplanation(pool) {
    const explanation = document.getElementById(`${pool}-score-explanation`);
    const arrow = document.getElementById(`${pool}-score-explanation-arrow`);
    
    if (explanation.classList.contains('visible')) {
        explanation.classList.remove('visible');
        arrow.textContent = '▶';
    } else {
        explanation.classList.add('visible');
        arrow.textContent = '▼';
    }
}