const logger = require('./logger');
const axios = require('axios');

const TOPIC = 'reversi-othello';

function sendAlert(subject, message) {
    const url = `https://ntfy.sh/${TOPIC}`;
    const body = `${subject}\n${message}`;

    axios.post(url, body, {
        headers: {
            'Title': subject,  
            'Priority': 'urgent', 
            'Tags': 'alert, reversi-game'
        }
    })
    .then(() => {
        logger.info('Уведомление отправлено через ntfy.sh');
    })
    .catch(err => {
        logger.error('Ошибка отправки ntfy.sh:', err);
    });
}

module.exports = sendAlert;
