import mailer from '../config/mailConfig.js';
import mailQueue from '../queues/mailQueue.js';

mailQueue.process(async (job) => {
    const emailData = job.data;
    console.log('Processing email job:', emailData);

    try {
        const response = await mailer.sendMail(emailData);
        console.log('Email sent successfully:', response);
    } catch (error) {
        console.log('Error processing email job:', error);
    }
})