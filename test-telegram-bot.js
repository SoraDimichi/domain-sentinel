/**
 * Test script for the Telegram bot notification service
 *
 * This script simulates a domain warning by directly publishing a message to Kafka
 * that will be consumed by the telegram-notifier microservice.
 */

const { Kafka } = require('kafkajs');

// Configure Kafka client
const kafka = new Kafka({
  clientId: 'telegram-bot-test',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

// Create a producer
const producer = kafka.producer();

// Test domain warning message
const testMessage = {
  domainId: 12345,
  domainName: 'test-malicious-domain.example',
  hasWarning: true,
  browserType: 'webkit',
  timestamp: new Date(),
};

// Function to send a test message
async function sendTestMessage() {
  try {
    // Connect to Kafka
    await producer.connect();
    console.log('Connected to Kafka');

    // Send the test message
    await producer.send({
      topic: 'domain-warnings',
      messages: [
        {
          value: JSON.stringify(testMessage),
          key: 'test-message',
        },
      ],
    });

    console.log('Test message sent successfully:');
    console.log(JSON.stringify(testMessage, null, 2));
    console.log('\nCheck your Telegram group for the notification!');
  } catch (error) {
    console.error('Error sending test message:', error);
  } finally {
    // Disconnect from Kafka
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  }
}

// Run the test
sendTestMessage();
