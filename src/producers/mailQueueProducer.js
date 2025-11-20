import '../processors/mailProcessor.js'

import mailQueue from "../queues/mailQueue.js";

export const addEmailToMailQueue = async (emailData) => {
    try {
        await mailQueue.add(emailData);
        console.log('Email job added to the mail queue');
    } catch (error) {
        console.log('Error adding email job to the mail queue:', error);
    }
};