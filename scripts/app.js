document.addEventListener('DOMContentLoaded', () => {
    // Configuration initiale
    const DEFAULT_HOLDINGS = 380498;
    let selectedPriceTarget = null;
    let currentScenario = 'base';
    let priceHistory = [0.00062];
    
    // Échelles d'objectifs de prix
    const PRICE_TARGETS = [
        { multiplier: 1.25, label: "+25%", description: "Gain conservateur" },
        { multiplier: 1.5, label: "+50%", description: "Croissance modérée" },
        { multiplier: 2, label: "+100%", description: "Doublement" },
        { multiplier: 3, label: "+200%", description: "Triplement" },
        { multiplier: 5, label: "+400%", description: "Croissance forte" },
        { multiplier: 10, label: "+900%", description: "Croissance maximale" }
    ];
    
    // Scénarios de marché
    const MARKET_SCENARIOS = {
        base: { volatility: 0.3, trend: 0.05, rsi: 54.3 },
        bull: { volatility: 0.2, trend: 0.15, rsi: 68.5 },
        bear: { volatility: 0.5, trend: -0.08, rsi: 32.7 },
        volatile: { volatility: 0.7, trend: 0.02, rsi: 49.1 }
    };
    
    // Cache les éléments DOM
    const DOM = {
        analyzeBtn: document.getElementById('analyzeBtn'),
        recommendation: document.getElementById('recommendation'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        progressPercent: document.getElementById('progressPercent'),
        priceTargetsContainer: document.getElementById('priceTargets'),
        customTargetInput: document.getElementById('customTarget'),
        solxAmountInput: document.getElementById('solxAmount'),
        currentPriceInput: document.getElementById('currentPrice'),
        holdingsDisplay: document.getElementById('holdingsDisplay'),
        currentValueDisplay: document.getElementById('currentValue'),
        targetValueDisplay: document.getElementById('targetValue'),
        simulateGrowthBtn: document.getElementById('simulateGrowth'),
        simulateDeclineBtn: document.getElementById('simulateDecline'),
        prevScenarioBtn: document.getElementById('prevScenario'),
        nextScenarioBtn: document.getElementById('nextScenario'),
        priceChart: document.getElementById('priceChart'),
        scenarioDisplay: document.getElementById('scenarioDisplay')
    };
    
    // Initialisation
    function init() {
        renderPriceTargets();
        updatePositionDisplay();
        generatePriceChart();
        updateMarketIndicators();
        setupEventListeners();
    }
    
    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        DOM.analyzeBtn.addEventListener('click', analyzePosition);
        DOM.customTargetInput.addEventListener('input', handleCustomTarget);
        DOM.solxAmountInput.addEventListener('input', updatePositionDisplay);
        DOM.currentPriceInput.addEventListener('input', () => {
            renderPriceTargets();
            updatePositionDisplay();
        });
        
        DOM.simulateGrowthBtn.addEventListener('click', simulateGrowth);
        DOM.simulateDeclineBtn.addEventListener('click', simulateDecline);
        DOM.prevScenarioBtn.addEventListener('click', prevScenario);
        DOM.nextScenarioBtn.addEventListener('click', nextScenario);
    }
    
    // Mise à jour de l'affichage de la position
    function updatePositionDisplay() {
        const solxAmount = parseInt(DOM.solxAmountInput.value) || DEFAULT_HOLDINGS;
        const currentPrice = parseFloat(DOM.currentPriceInput.value) || 0.00062;
        
        DOM.holdingsDisplay.textContent = solxAmount.toLocaleString();
        DOM.currentValueDisplay.textContent = '$' + (solxAmount * currentPrice).toFixed(2);
        
        if (selectedPriceTarget) {
            DOM.targetValueDisplay.textContent = '$' + (solxAmount * selectedPriceTarget).toFixed(2);
        }
    }
    
    // Affiche les objectifs de prix
    function renderPriceTargets() {
        DOM.priceTargetsContainer.innerHTML = '';
        const currentPrice = parseFloat(DOM.currentPriceInput.value) || 0.00062;
        
        PRICE_TARGETS.forEach(target => {
            const price = currentPrice * target.multiplier;
            const element = document.createElement('div');
            element.className = 'price-target';
            element.innerHTML = `
                <h3>${target.label}</h3>
                <p>${price.toFixed(6)}$</p>
                <small>${target.description}</small>
            `;
            
            element.addEventListener('click', () => {
                selectPriceTarget(price, element);
            });
            
            DOM.priceTargetsContainer.appendChild(element);
        });
    }
    
    // Sélectionne un objectif de prix
    function selectPriceTarget(price, element) {
        document.querySelectorAll('.price-target').forEach(el => {
            el.classList.remove('selected');
        });
        
        element.classList.add('selected');
        selectedPriceTarget = price;
        DOM.customTargetInput.value = '';
        
        updatePositionDisplay();
        analyzePosition();
    }
    
    // Gère la saisie d'un objectif personnalisé
    function handleCustomTarget() {
        if (this.value) {
            document.querySelectorAll('.price-target').forEach(el => {
                el.classList.remove('selected');
            });
            selectedPriceTarget = parseFloat(this.value);
            updatePositionDisplay();
            analyzePosition();
        }
    }
    
    // Analyse la position et fait une recommandation
    function analyzePosition() {
        const currentPrice = parseFloat(DOM.currentPriceInput.value) || 0;
        const solxAmount = parseInt(DOM.solxAmountInput.value) || DEFAULT_HOLDINGS;
        
        if (!selectedPriceTarget && !DOM.customTargetInput.value) {
            const firstTarget = document.querySelector('.price-target');
            if (firstTarget) firstTarget.click();
            return;
        }
        
        const priceTarget = selectedPriceTarget || parseFloat(DOM.customTargetInput.value);
        
        if (!priceTarget || priceTarget <= 0) {
            DOM.recommendation.innerHTML = `
                <div class="advice-container">
                    <h3><i class="fas fa-exclamation-triangle warning"></i> Objectif manquant</h3>
                    <p>Veuillez sélectionner ou définir un objectif de prix valide pour générer une stratégie.</p>
                </div>
            `;
            return;
        }
        
        // Calcul des valeurs
        const totalValue = solxAmount * currentPrice;
        const targetValue = solxAmount * priceTarget;
        const progressPercentage = Math.min(100, (currentPrice / priceTarget) * 100);
        const remainingPercentage = 100 - progressPercentage;
        const priceDifference = priceTarget - currentPrice;
        const priceDifferencePerc = (priceDifference / currentPrice * 100).toFixed(1);
        
        // Déterminer la recommandation
        let adviceHeader = '';
        let adviceDetails = '';
        
        if (currentPrice >= priceTarget) {
            const sellPercentage = calculateSellPercentage(progressPercentage);
            const sellAmount = (solxAmount * sellPercentage / 100).toFixed(2);
            const sellValue = (sellAmount * currentPrice).toFixed(2);
            
            adviceHeader = `<h3><i class="fas fa-trophy success"></i> Objectif Atteint!</h3>`;
            adviceDetails = `
                <p>Votre objectif de prix (<span class="highlight">${priceTarget.toFixed(6)}$</span>) a été atteint avec succès.</p>
                <p><strong>Recommandation stratégique :</strong></p>
                <ul class="advice-list">
                    <li><span class="highlight">Vendre ${sellPercentage}%</span> de votre position (${sellAmount} SOLX) pour <span class="highlight">${sellValue}$</span></li>
                    <li>Placer un ordre stop-loss à <span class="highlight">${(priceTarget * 0.95).toFixed(6)}$</span> pour protéger les gains</li>
                    <li>Recycler 20% des bénéfices dans d'autres actifs prometteurs</li>
                    <li>Conserver le reste pour des objectifs plus ambitieux</li>
                </ul>
            `;
        } else {
            if (progressPercentage > 85) {
                adviceHeader = `<h3><i class="fas fa-bullseye highlight"></i> Objectif à Portée</h3>`;
                adviceDetails = `
                    <p>Vous êtes à <span class="highlight">${remainingPercentage.toFixed(1)}%</span> de votre objectif (${priceDifferencePerc}% sous l'objectif).</p>
                    <p><strong>Stratégie recommandée :</strong></p>
                    <ul class="advice-list">
                        <li><span class="highlight">Maintenir la position</span> actuelle</li>
                        <li>Placer un ordre limite à <span class="highlight">${priceTarget.toFixed(6)}$</span> pour 20% de votre portefeuille</li>
                        <li>Surveiller les volumes et les signaux techniques pour confirmer la tendance</li>
                        <li>Préparer un plan de sortie échelonnée pour sécuriser les gains</li>
                    </ul>
                `;
            } else if (progressPercentage > 60) {
                adviceHeader = `<h3><i class="fas fa-chart-line highlight"></i> Progression Significative</h3>`;
                adviceDetails = `
                    <p>Vous avez complété <span class="highlight">${progressPercentage.toFixed(1)}%</span> du chemin vers votre objectif (${priceDifferencePerc}% restant).</p>
                    <p><strong>Stratégie recommandée :</strong></p>
                    <ul class="advice-list">
                        <li><span class="highlight">Consolider votre position</span> sans vendre</li>
                        <li>Étudier les opportunités de DCA (Dollar Cost Averaging) si le prix baisse de 15%</li>
                        <li>Diversifier 10% du portefeuille dans des actifs complémentaires</li>
                        <li>Réévaluer votre objectif si les fondamentaux changent</li>
                    </ul>
                `;
            } else if (progressPercentage > 30) {
                adviceHeader = `<h3><i class="fas fa-hourglass-half warning"></i> Phase d'Accumulation</h3>`;
                adviceDetails = `
                    <p>Vous avez parcouru <span class="highlight">${progressPercentage.toFixed(1)}%</span> du chemin vers votre objectif (${priceDifferencePerc}% restant).</p>
                    <p><strong>Stratégie recommandée :</strong></p>
                    <ul class="advice-list">
                        <li><span class="highlight">Maintenir une position patiente</span></li>
                        <li>Envisager une augmentation de position lors des creux techniques</li>
                        <li>Définir des objectifs intermédiaires pour surveiller la progression</li>
                        <li>Analyser les fondamentaux du projet régulièrement</li>
                    </ul>
                `;
            } else {
                adviceHeader = `<h3><i class="fas fa-seedling success"></i> Opportunité à Long Terme</h3>`;
                adviceDetails = `
                    <p>Vous êtes au début du parcours avec <span class="highlight">${progressPercentage.toFixed(1)}%</span> accompli (${priceDifferencePerc}% restant).</p>
                    <p><strong>Stratégie recommandée :</strong></p>
                    <ul class="advice-list">
                        <li><span class="highlight">Conserver pour le long terme</span></li>
                        <li>Envisager un staking si disponible pour générer des revenus passifs</li>
                        <li>Diversifier votre portefeuille pour réduire les risques</li>
                        <li>Surveiller les développements du projet et les nouvelles du marché</li>
                    </ul>
                `;
            }
        }
        
        // Mettre à jour l'interface
        updateProgressBar(progressPercentage);
        DOM.currentValueDisplay.textContent = '$' + totalValue.toFixed(2);
        DOM.targetValueDisplay.textContent = '$' + targetValue.toFixed(2);
        
        DOM.recommendation.innerHTML = `
            <div class="advice-container">
                ${adviceHeader}
                ${adviceDetails}
                <div class="value-display">
                    <span>Valeur actuelle :</span>
                    <span class="highlight">${totalValue.toFixed(2)}$</span>
                </div>
                <div class="value-display">
                    <span>Valeur à l'objectif :</span>
                    <span class="highlight">${targetValue.toFixed(2)}$</span>
                </div>
                <div class="value-display">
                    <span>Gain potentiel :</span>
                    <span class="highlight">${(targetValue - totalValue).toFixed(2)}$</span>
                </div>
            </div>
        `;
    }
    
    // Calcule le pourcentage à vendre
    function calculateSellPercentage(progress) {
        if (progress >= 150) return 40;
        if (progress >= 120) return 30;
        if (progress >= 100) return 20;
        return 0;
    }
    
    // Met à jour la barre de progression
    function updateProgressBar(percentage) {
        DOM.progressFill.style.width = `${percentage}%`;
        DOM.progressText.textContent = `${percentage.toFixed(1)}%`;
        DOM.progressPercent.textContent = `${percentage.toFixed(1)}%`;
        
        // Mise à jour des couleurs
        if (percentage >= 100) {
            DOM.progressFill.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
        } else if (percentage > 70) {
            DOM.progressFill.style.background = 'linear-gradient(90deg, #0ea5e9, #0284c7)';
        } else if (percentage > 40) {
            DOM.progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            DOM.progressFill.style.background = 'linear-gradient(90deg, #64748b, #475569)';
        }
    }
    
    // Simule une croissance des prix
    function simulateGrowth() {
        const currentPrice = parseFloat(DOM.currentPriceInput.value) || 0.00062;
        const newPrice = currentPrice * (1 + (0.05 + Math.random() * 0.1));
        DOM.currentPriceInput.value = newPrice.toFixed(6);
        renderPriceTargets();
        updatePositionDisplay();
        analyzePosition();
        addToPriceHistory(newPrice);
        generatePriceChart();
    }
    
    // Simule une baisse des prix
    function simulateDecline() {
        const currentPrice = parseFloat(DOM.currentPriceInput.value) || 0.00062;
        const newPrice = currentPrice * (1 - (0.03 + Math.random() * 0.07));
        DOM.currentPriceInput.value = newPrice.toFixed(6);
        renderPriceTargets();
        updatePositionDisplay();
        analyzePosition();
        addToPriceHistory(newPrice);
        generatePriceChart();
    }
    
    // Ajoute un prix à l'historique
    function addToPriceHistory(price) {
        priceHistory.push(price);
        if (priceHistory.length > 10) {
            priceHistory.shift();
        }
    }
    
    // Génère le graphique des prix
    function generatePriceChart() {
        if (priceHistory.length < 2) return;
        
        const svgNS = "http://www.w3.org/2000/svg";
        DOM.priceChart.innerHTML = '';
        
        const width = DOM.priceChart.clientWidth;
        const height = DOM.priceChart.clientHeight;
        const padding = 20;
        
        // Trouver les valeurs min et max
        const minPrice = Math.min(...priceHistory);
        const maxPrice = Math.max(...priceHistory);
        const priceRange = maxPrice - minPrice || 0.001;
        
        // Créer le chemin SVG
        const path = document.createElementNS(svgNS, "path");
        let pathData = `M ${padding} ${height - padding - ((priceHistory[0] - minPrice) / priceRange * (height - 2 * padding))} `;
        
        for (let i = 1; i < priceHistory.length; i++) {
            const x = padding + (i / (priceHistory.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((priceHistory[i] - minPrice) / priceRange * (height - 2 * padding));
            pathData += `L ${x} ${y} `;
        }
        
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", "#38bdf8");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        
        DOM.priceChart.appendChild(path);
    }
    
    // Change le scénario de marché
    function prevScenario() {
        const scenarios = Object.keys(MARKET_SCENARIOS);
        const currentIndex = scenarios.indexOf(currentScenario);
        const newIndex = (currentIndex - 1 + scenarios.length) % scenarios.length;
        currentScenario = scenarios[newIndex];
        updateMarketIndicators();
    }
    
    function nextScenario() {
        const scenarios = Object.keys(MARKET_SCENARIOS);
        const currentIndex = scenarios.indexOf(currentScenario);
        const newIndex = (currentIndex + 1) % scenarios.length;
        currentScenario = scenarios[newIndex];
        updateMarketIndicators();
    }
    
    // Met à jour les indicateurs de marché
    function updateMarketIndicators() {
        const scenario = MARKET_SCENARIOS[currentScenario];
        const indicators = document.querySelectorAll('.indicator-value');
        
        indicators[0].textContent = 
            scenario.volatility > 0.5 ? "Élevée" : scenario.volatility > 0.3 ? "Modérée" : "Faible";
        
        indicators[1].textContent = 
            scenario.trend > 0.1 ? "Forte hausse" : 
            scenario.trend > 0 ? "Hausse modérée" : 
            scenario.trend < -0.05 ? "Forte baisse" : "Baisse modérée";
        
        indicators[2].textContent = scenario.rsi.toFixed(1);
        
        const gauges = document.querySelectorAll('.gauge-fill');
        gauges[0].style.width = (scenario.volatility * 100) + '%';
        gauges[1].style.width = ((scenario.trend + 0.2) * 250) + '%';
        gauges[2].style.width = scenario.rsi + '%';
        
        DOM.scenarioDisplay.textContent = 
            currentScenario === 'base' ? 'Base' : 
            currentScenario === 'bull' ? 'Haussière' : 
            currentScenario === 'bear' ? 'Baissière' : 'Volatile';
    }
    
    // Lancement de l'application
    init();
});

