const {
    generateAlertEmailTemplate,
    generateServiceEmailTemplate,
    generateInterestEmailTemplate,
    generateCompletionEmailTemplate
} = require('./services/emailService');

// Mock Data
const mockSender = {
    name: 'Ramesh Gupta',
    locality: 'Madhapur',
    town: 'Hyderabad',
    district: 'Rangareddy',
    profilePhoto: '/uploads/photo.jpg',
    phone: '9876543210',
    email: 'ramesh@example.com',
    professionCategory: 'Business',
    professionDetails: { jobRole: 'Shop Owner' }
};

const mockAlert = {
    category: 'Emergency',
    subType: 'Medical',
    description: 'Need urgent ambulance service near Hitech City.',
    locality: 'Madhapur',
    town: 'Hyderabad'
};

const mockService = {
    _id: '12345',
    title: 'Plumbing Repair',
    description: 'Leaking tap need fix immediately.',
    locality: 'Madhapur',
    town: 'Hyderabad'
};

const mockProvider = {
    name: 'Suresh Plumber',
    locality: 'Kukatpally'
};

console.log("--- Testing Alert Template ---");
console.log(generateAlertEmailTemplate(mockAlert, mockSender));

console.log("\n--- Testing Service Offer Template ---");
console.log(generateServiceEmailTemplate(mockService, mockSender, 'offer'));

console.log("\n--- Testing Service Request Template ---");
console.log(generateServiceEmailTemplate(mockService, mockSender, 'request'));

console.log("\n--- Testing Interest Template ---");
console.log(generateInterestEmailTemplate(mockService, mockSender));

console.log("\n--- Testing Completion Template ---");
const completionHtml = generateCompletionEmailTemplate(mockService, mockProvider, 500);
console.log(completionHtml);

// Write to file with explicit UTF8
const fs = require('fs');
const allOutput = `
--- Alert ---
${generateAlertEmailTemplate(mockAlert, mockSender)}

--- Offer ---
${generateServiceEmailTemplate(mockService, mockSender, 'offer')}

--- Request ---
${generateServiceEmailTemplate(mockService, mockSender, 'request')}

--- Interest ---
${generateInterestEmailTemplate(mockService, mockSender)}

--- Completion ---
${completionHtml}
`;

fs.writeFileSync('test_output_utf8.txt', allOutput, 'utf8');
console.log("Output written to test_output_utf8.txt");
