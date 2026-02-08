const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const invitationCard = document.getElementById('invitation-card');
const celebration = document.getElementById('celebration');
const questionText = document.getElementById('question');
const bearImg = document.getElementById('bear-img');
const successText = document.getElementById('success-message');

// Configuration management
let invitationConfig = {
    question: 'Would you like to be my Valentine?',
    bearDefault: 'https://media.tenor.com/63IENW605s0AAAAi/dudu-twisting-dance.gif',
    bearSuccess: 'https://media.tenor.com/0_jT8Pyszi8AAAAi/bubu-dudu-dudu-carry.gif',
    successMessage: 'Yay! ❤️'
};

// Sync with parent config if available
function syncConfig() {
    try {
        const parentConfig = window.parent.CONFIG;
        if (parentConfig && parentConfig.invitation) {
            invitationConfig = { ...invitationConfig, ...parentConfig.invitation };
            applyConfig();
        }
    } catch (e) {
        console.log('[Invitation] Could not access parent config:', e);
    }
}

function applyConfig() {
    if (questionText) questionText.textContent = invitationConfig.question;
    if (bearImg) bearImg.src = invitationConfig.bearDefault;
    if (successText) successText.textContent = invitationConfig.successMessage;
    // Update celebration bear if it exists
    const celebrationBear = document.getElementById('success-bear-img');
    if (celebrationBear) celebrationBear.src = invitationConfig.bearSuccess;
}

// Initial sync
syncConfig();

// Listen for direct parent messages for faster updates
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_CONFIG') {
        const config = event.data.config;
        if (config && config.invitation) {
            invitationConfig = { ...invitationConfig, ...config.invitation };
            applyConfig();
        }
    }
});

let scale = 1;
const noMessages = [
    "No",
    "Are you sure?",
    "Really sure??",
    "Think again!",
    "Last chance!",
    "Surely not?",
    "You might regret this!",
    "Give it another thought!",
    "Are you absolutely sure?",
    "This could be a mistake!",
    "Have a heart!",
    "Don't be so cold!",
    "Change of heart?",
    "Wouldn't you reconsider?",
    "Is that your final answer?",
    "You're breaking my heart ;("
];

const noGifs = [
    "https://media.tenor.com/fvphRD_LUEMAAAAi/bear-angry.gif",
    "https://media.tenor.com/MN70fG-X1jcAAAAi/angry-dudu-dudu-kill.gif",
    "https://media.tenor.com/53nKdhGBdMAAAAAi/bubududu-sseeyall.gif",
    "https://media.tenor.com/hRanVEh2bDEAAAAi/bear-panda.gif"
];

let messageIndex = 0;

noBtn.addEventListener('click', () => {
    // 1. Increase Yes Button size
    scale += 0.5;
    yesBtn.style.transform = `scale(${scale})`;

    // 2. Change No button text for the "pleading" effect
    messageIndex = (messageIndex + 1) % noMessages.length;
    noBtn.textContent = noMessages[messageIndex];

    // 3. Change Bear to a sequence of Angry/Sad mode
    if (bearImg) {
        // Use messageIndex - 1 so the first No click shows the first GIF (index 0)
        const gifIndex = Math.min(messageIndex - 1, noGifs.length - 1);
        bearImg.src = noGifs[gifIndex];
    }

    // 4. Add a little shake to the card on click
    invitationCard.style.animation = 'none';
    invitationCard.offsetHeight; // trigger reflow
    invitationCard.style.animation = 'card-shake 0.4s ease';
});

yesBtn.addEventListener('click', () => {
    // Hide invitation and show celebration
    invitationCard.classList.add('hidden');
    celebration.classList.remove('hidden');

    // Trigger confetti
    startConfetti();
});

function startConfetti() {
    const colors = ['#7e0c23', '#B76E79', '#fecdd3', '#ffffff', '#fb7185'];
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = Math.random() * 8 + 4 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        confetti.style.zIndex = '1000';
        confetti.style.animation = `fall ${Math.random() * 2 + 3}s linear forwards`;
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
    }
}

// Add the keyframes dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes fall {
    to {
        transform: translateY(110vh) rotate(720deg);
        opacity: 0;
    }
}
@keyframes card-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
