const fs = require('fs');
const path = require('path');
const { generateServiceEmailTemplate, generateInterestEmailTemplate, generateCompletionEmailTemplate } = require('../server/services/emailService');

// Mock Data
const mockCreator = {
    _id: 'user123',
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    phone: '9876543210',
    professionCategory: 'Student',
    professionDetails: { jobRole: 'Engineering Student' },
    locality: 'Indiranagar'
};

const mockProvider = {
    _id: 'provider456',
    name: 'Suresh Electrician',
    email: 'suresh@example.com',
    phone: '9123456780',
    professionCategory: 'Employed',
    locality: 'Indiranagar'
};

const mockServiceOffer = {
    _id: 'serv1',
    title: 'Basic Computer Training for Seniors',
    description: 'I can teach basics of computer, internet and smartphone usage to senior citizens on weekends.',
    locality: 'Indiranagar',
    type: 'offer'
};

const mockServiceRequest = {
    _id: 'serv2',
    title: 'Need Plumber for Leak Fix',
    description: 'Urgent: Kitchen sink pipe is leaking heavily. Need someone to fix it immediately.',
    locality: 'Indiranagar',
    type: 'request'
};

// Generate Templates
console.log('Generating templates...');

const offerHtml = generateServiceEmailTemplate(mockServiceOffer, mockCreator, 'offer');
const requestHtml = generateServiceEmailTemplate(mockServiceRequest, mockCreator, 'request');
const interestHtml = generateInterestEmailTemplate(mockServiceRequest, mockProvider);
const completionHtml = generateCompletionEmailTemplate(mockServiceRequest, mockProvider, 500);

// Output Directory
const outputDir = path.join(__dirname, '..', 'email_samples');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Save Files
fs.writeFileSync(path.join(outputDir, 'offer_email.html'), offerHtml);
fs.writeFileSync(path.join(outputDir, 'request_email.html'), requestHtml);
fs.writeFileSync(path.join(outputDir, 'interest_email.html'), interestHtml);
fs.writeFileSync(path.join(outputDir, 'completion_email.html'), completionHtml);

console.log(`\nSuccess! Generated 4 email samples in: ${outputDir}`);
console.log('1. offer_email.html');
console.log('2. request_email.html');
console.log('3. interest_email.html');
console.log('4. completion_email.html');
