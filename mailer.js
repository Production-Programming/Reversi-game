const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'тут почта',
        pass: 'тут пароль'
    }
});

function sendAlert(subject, message) {
    const mailOptions = {
        from: '"Game Server Monitor" <тут почта>',
        to: 'тут почта',
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log('Ошибка при отправке письма:', error);
        } else {
            console.log('Письмо отправлено:', info.response);
        }
    });
}

module.exports = sendAlert;
